import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import TaxFields from "@/components/tax-fields";
import { requireUser } from "@/lib/auth";
import { updateClientWithSubscription } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

type EditarClientePageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarClientePage({
    params,
}: EditarClientePageProps) {
    const { id } = await params;
    const { user, supabase } = await requireUser();

    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select(`
      id,
      business_name,
      tax_id,
      address,
      postal_code,
      city,
      province,
      country,
      email,
      payment_method,
      active,
      subscriptions (
        id,
        service_name,
        service_description,
        base_amount,
        tax_type,
        tax_rate,
        apply_irpf,
        irpf_rate,
        renewal_day,
        active
      )
    `)
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (clientError) {
        throw new Error(clientError.message);
    }

    if (!client || !client.active) {
        notFound();
    }

    const subscriptions = Array.isArray(client.subscriptions)
        ? client.subscriptions
        : [];

    const subscription =
        subscriptions.find((item) => item.active) ??
        subscriptions[0] ??
        null;

    if (!subscription) {
        throw new Error(
            "Este cliente no tiene ninguna suscripción asociada."
        );
    }

    return (
        <>
            <PageHeader
                title="Editar cliente"
                description={client.business_name}
                actions={
                    <LinkButton href="/dashboard/clientes" variant="secondary" size="sm">
                        <ArrowLeft className="size-4" />
                        Volver
                    </LinkButton>
                }
            />

            <form action={updateClientWithSubscription} className="space-y-5">
                <input type="hidden" name="client_id" value={client.id} />
                <input type="hidden" name="subscription_id" value={subscription.id} />

                <Card>
                    <CardBody>
                        <h2 className="mb-4 text-[14px] font-semibold text-ink">Datos del cliente</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Nombre del negocio">
                                <Input name="business_name" defaultValue={client.business_name ?? ""} required />
                            </Field>

                            <Field label="NIF/CIF">
                                <Input name="tax_id" defaultValue={client.tax_id ?? ""} required />
                            </Field>

                            <Field label="Dirección">
                                <Input name="address" defaultValue={client.address ?? ""} required />
                            </Field>

                            <Field label="Código postal">
                                <Input name="postal_code" defaultValue={client.postal_code ?? ""} />
                            </Field>

                            <Field label="Municipio">
                                <Input name="city" defaultValue={client.city ?? ""} />
                            </Field>

                            <Field label="Provincia">
                                <Input name="province" defaultValue={client.province ?? ""} />
                            </Field>

                            <Field label="País">
                                <Input name="country" defaultValue={client.country ?? "España"} />
                            </Field>

                            <Field label="Correo">
                                <Input name="email" type="email" defaultValue={client.email ?? ""} />
                            </Field>

                            <Field label="Forma de pago">
                                <Select
                                    name="payment_method"
                                    defaultValue={client.payment_method ?? "Transferencia bancaria"}
                                >
                                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                                    <option value="Domiciliación bancaria">Domiciliación bancaria</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Stripe">Stripe</option>
                                </Select>
                            </Field>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="mb-4 text-[14px] font-semibold text-ink">Servicio recurrente</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Nombre del servicio">
                                <Input
                                    name="service_name"
                                    defaultValue={subscription.service_name ?? ""}
                                    required
                                />
                            </Field>

                            <Field label="Base imponible mensual">
                                <Input
                                    name="base_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={subscription.base_amount ?? 0}
                                    required
                                />
                            </Field>

                            <Field label="Descripción" className="md:col-span-2">
                                <Textarea
                                    name="service_description"
                                    rows={3}
                                    defaultValue={subscription.service_description ?? ""}
                                />
                            </Field>

                            <TaxFields
                                initialTaxType={subscription.tax_type ?? "IGIC"}
                                initialTaxRate={Number(subscription.tax_rate ?? 7)}
                            />

                            <Field
                                label="Día de renovación"
                                hint="Del 1 al 31. En meses más cortos se usará el último día."
                            >
                                <Input
                                    name="renewal_day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    defaultValue={subscription.renewal_day ?? 1}
                                    required
                                />
                            </Field>

                            <Field label="Aplicar retención de IRPF" inline className="md:col-span-2">
                                <Checkbox name="apply_irpf" defaultChecked={subscription.apply_irpf ?? false} />
                            </Field>

                            <Field label="Porcentaje de IRPF">
                                <Input
                                    name="irpf_rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={subscription.irpf_rate ?? 7}
                                    required
                                />
                            </Field>
                        </div>
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-2">
                    <LinkButton href="/dashboard/clientes" variant="secondary">
                        Cancelar
                    </LinkButton>
                    <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
                </div>
            </form>
        </>
    );
}
