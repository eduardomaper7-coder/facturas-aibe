"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function saveCompany(formData: FormData) {
  const { user, supabase } = await requireUser();

  const payload = {
    user_id: user.id,
    legal_name: String(formData.get("legal_name") ?? ""),
    trade_name: String(formData.get("trade_name") ?? ""),
    tax_id: String(formData.get("tax_id") ?? ""),
    address: String(formData.get("address") ?? ""),
    postal_code: String(formData.get("postal_code") ?? ""),
    city: String(formData.get("city") ?? ""),
    province: String(formData.get("province") ?? ""),
    country: String(formData.get("country") ?? "España"),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    iban: String(formData.get("iban") ?? ""),
    logo_url: String(formData.get("logo_url") ?? "") || null,
    invoice_prefix: String(formData.get("invoice_prefix") ?? "AIBE"),
    footer_text: String(formData.get("footer_text") ?? "Gracias por su confianza"),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("company_settings")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/empresa");
  redirect("/dashboard/empresa?saved=1");
}
