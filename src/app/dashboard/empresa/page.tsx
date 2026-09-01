import { requireUser } from "@/lib/auth";
import { saveCompany } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { SavedBanner } from "@/components/ui/toast-banner";
import { LogoField } from "./logo-field";

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
      <PageHeader
        title="Datos de empresa"
        description="Información utilizada para generar tus facturas."
      />

      <SavedBanner param="saved" message="Datos guardados correctamente." />

      <form action={saveCompany} className="space-y-5">
        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Información fiscal</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Razón social">
                <Input name="legal_name" defaultValue={v("legal_name")} required />
              </Field>
              <Field label="Nombre comercial">
                <Input name="trade_name" defaultValue={v("trade_name")} />
              </Field>
              <Field label="NIF/CIF">
                <Input name="tax_id" defaultValue={v("tax_id")} required />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Contacto</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Correo">
                <Input name="email" type="email" defaultValue={v("email", user.email ?? "")} />
              </Field>
              <Field label="Teléfono">
                <Input name="phone" defaultValue={v("phone")} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Dirección fiscal</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Dirección" className="md:col-span-2">
                <Input name="address" defaultValue={v("address")} required />
              </Field>
              <Field label="Código postal">
                <Input name="postal_code" defaultValue={v("postal_code")} />
              </Field>
              <Field label="Municipio">
                <Input name="city" defaultValue={v("city")} />
              </Field>
              <Field label="Provincia">
                <Input name="province" defaultValue={v("province")} />
              </Field>
              <Field label="País">
                <Input name="country" defaultValue={v("country", "España")} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Facturación</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="IBAN">
                <Input name="iban" defaultValue={v("iban")} />
              </Field>
              <Field label="Prefijo de factura">
                <Input name="invoice_prefix" defaultValue={v("invoice_prefix", "AIBE")} />
              </Field>
              <Field label="Texto del pie" className="md:col-span-2">
                <Input name="footer_text" defaultValue={v("footer_text", "Gracias por su confianza")} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Identidad visual</h2>
            <LogoField initialUrl={v("logo_url")} />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <SubmitButton pendingText="Guardando…">Guardar datos</SubmitButton>
        </div>
      </form>
    </>
  );
}
