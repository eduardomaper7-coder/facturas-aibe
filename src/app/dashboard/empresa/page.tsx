import { requireUser } from "@/lib/auth";
import { saveCompany } from "./actions";

export default async function EmpresaPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const v = (key: string, fallback = "") => data?.[key] ?? fallback;

  return (
    <>
      <h1>Datos de mi empresa</h1>
      <form action={saveCompany} className="card grid">
        <div className="grid grid-2">
          <label>Razón social<input name="legal_name" defaultValue={v("legal_name")} required /></label>
          <label>Nombre comercial<input name="trade_name" defaultValue={v("trade_name")} /></label>
          <label>NIF/CIF<input name="tax_id" defaultValue={v("tax_id")} required /></label>
          <label>Correo<input name="email" type="email" defaultValue={v("email", user.email ?? "")} /></label>
          <label>Dirección<input name="address" defaultValue={v("address")} required /></label>
          <label>Código postal<input name="postal_code" defaultValue={v("postal_code")} /></label>
          <label>Municipio<input name="city" defaultValue={v("city")} /></label>
          <label>Provincia<input name="province" defaultValue={v("province")} /></label>
          <label>País<input name="country" defaultValue={v("country", "España")} /></label>
          <label>Teléfono<input name="phone" defaultValue={v("phone")} /></label>
          <label>IBAN<input name="iban" defaultValue={v("iban")} /></label>
          <label>URL pública del logo<input name="logo_url" type="url" defaultValue={v("logo_url")} /></label>
          <label>Prefijo de factura<input name="invoice_prefix" defaultValue={v("invoice_prefix", "AIBE")} /></label>
          <label>Texto del pie<input name="footer_text" defaultValue={v("footer_text", "Gracias por su confianza")} /></label>
        </div>
        <button type="submit">Guardar datos</button>
      </form>
    </>
  );
}
