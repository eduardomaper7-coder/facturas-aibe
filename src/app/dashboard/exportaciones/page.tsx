import { FileSpreadsheet, HardDrive } from "lucide-react";
import { currentPeriod } from "@/lib/dates";
import { periodLabel } from "@/lib/ui";
import { pasarADriveYExcel } from "../facturas/actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/month-picker";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ExportacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const period = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentPeriod();

  return (
    <>
      <PageHeader
        title="Exportaciones"
        description="Exporta y organiza la información financiera de cada periodo."
      />

      <Card>
        <CardHeader
          title="Exportación mensual"
          description={periodLabel(period, { capitalize: true })}
          actions={<MonthPicker defaultValue={period} label="Cambiar" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ExportOption
              icon={FileSpreadsheet}
              title="Google Sheets"
              description="Crea una hoja con las facturas, importes y totales del mes."
              action={
                <LinkButton href={`/api/google-sheets?period=${period}`} variant="secondary" size="sm">
                  Crear Google Sheet
                </LinkButton>
              }
            />

            <ExportOption
              icon={HardDrive}
              title="Drive y Excel"
              description="Sube los PDF de las facturas del mes a Drive (sin duplicados) y los enlaza en la hoja de cálculo."
              action={
                <form action={pasarADriveYExcel}>
                  <input type="hidden" name="period" value={period} />
                  <SubmitButton variant="secondary" size="sm" pendingText="Enviando…">
                    Subir a Drive
                  </SubmitButton>
                </form>
              }
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function ExportOption({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" />
        </span>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      </div>
      <p className="flex-1 text-[13px] text-muted">{description}</p>
      {action}
    </div>
  );
}
