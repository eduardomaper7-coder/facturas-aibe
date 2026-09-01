import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ClientsTable, type ClientRow } from "./clients-table";

export default async function ClientesPage() {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      business_name,
      tax_id,
      email,
      payment_method,
      active,
      subscriptions (
        id,
        service_name,
        base_amount,
        tax_type,
        tax_rate,
        apply_irpf,
        irpf_rate,
        renewal_day,
        active
      )
    `
    )
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const clients: ClientRow[] = (data ?? []).map((client) => {
    const subscriptions = Array.isArray(client.subscriptions) ? client.subscriptions : [];
    const subscription = subscriptions.find((item) => item.active) ?? null;

    return {
      id: client.id,
      businessName: client.business_name,
      taxId: client.tax_id,
      email: client.email,
      subscription: subscription
        ? {
            id: subscription.id,
            serviceName: subscription.service_name,
            baseAmount: Number(subscription.base_amount),
            taxType: subscription.tax_type,
            taxRate: Number(subscription.tax_rate),
            applyIrpf: subscription.apply_irpf,
            irpfRate: Number(subscription.irpf_rate),
            renewalDay: Number(subscription.renewal_day),
          }
        : null,
    };
  });

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes y sus datos de facturación."
        actions={
          <LinkButton href="/dashboard/clientes/nuevo">
            <Plus className="size-4" />
            Nuevo cliente
          </LinkButton>
        }
      />

      <Card>
        <ClientsTable clients={clients} />
      </Card>
    </>
  );
}
