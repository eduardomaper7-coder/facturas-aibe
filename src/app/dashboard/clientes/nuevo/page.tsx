import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TaxFields from "@/components/tax-fields";
import { createClientWithSubscription } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default function NuevoClientePage() {
  return (
    <>
      <PageHeader
        title="Nuevo cliente"
        description="Da de alta un cliente y su servicio recurrente."
        actions={
          <LinkButton href="/dashboard/clientes" variant="secondary" size="sm">
            <ArrowLeft className="size-4" />
            Volver
          </LinkButton>
        }
      />

      <form action={createClientWithSubscription} className="space-y-5">
        <Card>
          <CardBody>
            <h2 className="mb-4 text-[14px] font-semibold text-ink">Datos del cliente</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nombre del negocio">
                <Input name="business_name" required />
              </Field>

              <Field label="NIF/CIF">
                <Input name="tax_id" required />
              </Field>

              <Field label="Dirección">
                <Input name="address" required />
              </Field>

              <Field label="Código postal">
                <Input name="postal_code" />
              </Field>

              <Field label="Municipio">
                <Input name="city" />
              </Field>

              <Field label="Provincia">
                <Input name="province" />
              </Field>

              <Field label="País">
                <Input name="country" defaultValue="España" />
              </Field>

              <Field label="Correo">
                <Input name="email" type="email" />
              </Field>

              <Field label="Forma de pago">
                <Select name="payment_method" defaultValue="Transferencia bancaria">
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
                <Input name="service_name" required />
              </Field>

              <Field label="Base imponible mensual">
                <Input name="base_amount" type="number" min="0" step="0.01" required />
              </Field>

              <Field label="Descripción" className="md:col-span-2">
                <Textarea name="service_description" rows={3} />
              </Field>

              <TaxFields />

              <Field
                label="Día de renovación"
                hint="Del 1 al 31. En meses más cortos se usará el último día."
              >
                <Input name="renewal_day" type="number" min="1" max="31" defaultValue="1" required />
              </Field>

              <Field label="Aplicar retención de IRPF" inline className="md:col-span-2">
                <Checkbox name="apply_irpf" defaultChecked />
              </Field>

              <Field label="Porcentaje de IRPF">
                <Input name="irpf_rate" type="number" min="0" step="0.01" defaultValue="7" required />
              </Field>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href="/dashboard/clientes" variant="secondary">
            Cancelar
          </LinkButton>
          <SubmitButton pendingText="Guardando…">Guardar cliente</SubmitButton>
        </div>
      </form>
    </>
  );
}
