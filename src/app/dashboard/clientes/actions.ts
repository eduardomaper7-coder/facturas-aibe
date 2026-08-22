"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

function getTaxRate(taxType: string): number {
  if (taxType === "IVA") {
    return 21;
  }

  if (taxType === "IGIC") {
    return 7;
  }

  return 0;
}

export async function createClientWithSubscription(formData: FormData) {
  const { user, supabase } = await requireUser();

  const taxType = String(
    formData.get("tax_type") ?? "IGIC"
  ).toUpperCase();

  const taxRate = getTaxRate(taxType);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      business_name: String(
        formData.get("business_name") ?? ""
      ),
      tax_id: String(formData.get("tax_id") ?? ""),
      address: String(formData.get("address") ?? ""),
      postal_code: String(
        formData.get("postal_code") ?? ""
      ),
      city: String(formData.get("city") ?? ""),
      province: String(formData.get("province") ?? ""),
      country: String(
        formData.get("country") ?? "España"
      ),
      email: String(formData.get("email") ?? ""),
      payment_method: String(
        formData.get("payment_method") ??
        "Transferencia bancaria"
      ),
    })
    .select("id")
    .single();

  if (clientError) {
    throw new Error(clientError.message);
  }

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      client_id: client.id,
      service_name: String(
        formData.get("service_name") ?? ""
      ),
      service_description: String(
        formData.get("service_description") ?? ""
      ),
      base_amount: Number(
        formData.get("base_amount") ?? 0
      ),
      tax_type: taxType,
      tax_rate: taxRate,
      apply_irpf: formData.get("apply_irpf") === "on",
      irpf_rate: Number(
        formData.get("irpf_rate") ?? 7
      ),
      renewal_day: Number(
        formData.get("renewal_day") ?? 1
      ),
    });

  if (subscriptionError) {
    await supabase
      .from("clients")
      .delete()
      .eq("id", client.id)
      .eq("user_id", user.id);

    throw new Error(subscriptionError.message);
  }

  redirect("/dashboard/clientes");
}

export async function updateClientWithSubscription(
  formData: FormData
) {
  const clientId = String(
    formData.get("client_id") ?? ""
  );

  const subscriptionId = String(
    formData.get("subscription_id") ?? ""
  );

  if (!clientId) {
    throw new Error("No se ha indicado el cliente");
  }

  if (!subscriptionId) {
    throw new Error("No se ha indicado la suscripción");
  }

  const { user, supabase } = await requireUser();

  const taxType = String(
    formData.get("tax_type") ?? "IGIC"
  ).toUpperCase();

  const taxRate = getTaxRate(taxType);
  const updatedAt = new Date().toISOString();

  const { data: updatedClient, error: clientError } =
    await supabase
      .from("clients")
      .update({
        business_name: String(
          formData.get("business_name") ?? ""
        ),
        tax_id: String(formData.get("tax_id") ?? ""),
        address: String(formData.get("address") ?? ""),
        postal_code: String(
          formData.get("postal_code") ?? ""
        ),
        city: String(formData.get("city") ?? ""),
        province: String(
          formData.get("province") ?? ""
        ),
        country: String(
          formData.get("country") ?? "España"
        ),
        email: String(formData.get("email") ?? ""),
        payment_method: String(
          formData.get("payment_method") ??
          "Transferencia bancaria"
        ),
        updated_at: updatedAt,
      })
      .eq("id", clientId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!updatedClient) {
    throw new Error("Cliente no encontrado");
  }

  const { data: updatedSubscription, error: subscriptionError } =
    await supabase
      .from("subscriptions")
      .update({
        service_name: String(
          formData.get("service_name") ?? ""
        ),
        service_description: String(
          formData.get("service_description") ?? ""
        ),
        base_amount: Number(
          formData.get("base_amount") ?? 0
        ),
        tax_type: taxType,
        tax_rate: taxRate,
        apply_irpf: formData.get("apply_irpf") === "on",
        irpf_rate: Number(
          formData.get("irpf_rate") ?? 7
        ),
        renewal_day: Number(
          formData.get("renewal_day") ?? 1
        ),
        updated_at: updatedAt,
      })
      .eq("id", subscriptionId)
      .eq("client_id", clientId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (!updatedSubscription) {
    throw new Error("Suscripción no encontrada");
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}/editar`);
  revalidatePath("/dashboard/facturas");

  redirect("/dashboard/clientes");
}

export async function deactivateClient(formData: FormData) {
  const clientId = String(
    formData.get("client_id") ?? ""
  );

  if (!clientId) {
    throw new Error("No se ha indicado el cliente");
  }

  const { user, supabase } = await requireUser();
  const updatedAt = new Date().toISOString();

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({
      active: false,
      updated_at: updatedAt,
    })
    .eq("client_id", clientId)
    .eq("user_id", user.id);

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  const { data: deactivatedClient, error: clientError } =
    await supabase
      .from("clients")
      .update({
        active: false,
        updated_at: updatedAt,
      })
      .eq("id", clientId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!deactivatedClient) {
    throw new Error("Cliente no encontrado");
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/facturas");
}