import { CheckCircle2, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { currentPeriod } from "@/lib/dates";
import { periodLabel } from "@/lib/ui";
import { generateMonthInvoices } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { ExportMenu } from "./export-menu";
import { InvoicesTable, type InvoiceRow } from "./invoices-table";

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    drive?: string;
    subidas?: string;
    existian?: string;
    enlazadas?: string;
    sinMatch?: string;
    ambiguas?: string;
    sheet?: string;
  }>;
}) {
  const params = await searchParams;

  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentPeriod();

  const driveResumen =
    params.drive === "1"
      ? {
          subidas: Number(params.subidas ?? 0),
          existian: Number(params.existian ?? 0),
          enlazadas: Number(params.enlazadas ?? 0),
          sinMatch: Number(params.sinMatch ?? 0),
          ambiguas: Number(params.ambiguas ?? 0),
          sheetEncontrada: params.sheet === "1",
        }
      : null;

  const { user, supabase } = await requireUser();

  const [{ data, error }, { data: companySettings }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id,invoice_number,issue_date,subtotal,tax_type,tax_rate,tax_amount,irpf_amount,total_amount,status,client_snapshot,email_sent_at,email_error"
      )
      .eq("billing_period", month)
      .order("issue_date", { ascending: false })
      .order("invoice_number", { ascending: false }),
    // La última factura emitida (globalmente, no solo de este mes) es la
    // única que se puede borrar: se usa para saber qué fila puede ofrecer
    // esa acción. next_invoice_number - 1 es siempre ese correlativo,
    // porque delete_invoice() lo mantiene así (ver supabase/schema.sql).
    supabase.from("company_settings").select("next_invoice_number").eq("user_id", user.id).maybeSingle(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const lastIssuedSequence = (companySettings?.next_invoice_number ?? 1) - 1;

  const invoices: InvoiceRow[] = (data ?? []).map((invoice) => {
    const client = invoice.client_snapshot as { business_name?: string; email?: string };
    const sequence = Number(invoice.invoice_number.match(/(\d+)$/)?.[0] ?? NaN);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      subtotal: Number(invoice.subtotal),
      taxType: invoice.tax_type,
      taxRate: Number(invoice.tax_rate),
      taxAmount: Number(invoice.tax_amount),
      irpfAmount: Number(invoice.irpf_amount),
      totalAmount: Number(invoice.total_amount),
      emailSentAt: invoice.email_sent_at,
      emailError: invoice.email_error,
      clientName: client.business_name ?? "—",
      clientEmail: client.email ?? null,
      isLastIssued: sequence === lastIssuedSequence,
    };
  });

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Gestiona, genera y envía la facturación mensual."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker defaultValue={month} />
            <ExportMenu period={month} />
            <form action={generateMonthInvoices}>
              <input type="hidden" name="period" value={month} />
              <SubmitButton pendingText="Generando…">
                <Sparkles className="size-4" />
                Generar facturas del mes
              </SubmitButton>
            </form>
          </div>
        }
      />

      {driveResumen && (
        <Card className="mb-5 border-success-border bg-success-soft">
          <CardBody className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <div className="text-[13px] text-success">
              <p className="font-semibold">Facturas enviadas a Drive y Excel</p>
              <p className="mt-1">
                {driveResumen.subidas} subidas nuevas · {driveResumen.existian} ya estaban en Drive ·{" "}
                {driveResumen.enlazadas} enlazadas en la hoja de cálculo
                {driveResumen.sinMatch > 0 && ` · ${driveResumen.sinMatch} sin fila con ese importe en la hoja`}
                {driveResumen.ambiguas > 0 && ` · ${driveResumen.ambiguas} con importe ambiguo (revisar a mano)`}
                {!driveResumen.sheetEncontrada &&
                  " · No se encontró la hoja de cálculo del mes, no se ha podido enlazar nada"}
                .
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <p className="mb-3 text-[13px] text-muted">
        Periodo: <span className="font-medium text-ink">{periodLabel(month, { capitalize: true })}</span>
      </p>

      <Card>
        <InvoicesTable invoices={invoices} month={month} />
      </Card>
    </>
  );
}
