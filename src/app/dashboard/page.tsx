import {
  BadgeEuro,
  FileText,
  HandCoins,
  Percent,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { currentPeriod } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { periodLabel, shiftPeriod } from "@/lib/ui";
import { generateMonthInvoices } from "./facturas/actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { MonthPicker } from "@/components/ui/month-picker";
import { MonthlyChart } from "./monthly-chart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { user, supabase } = await requireUser();

  const period =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentPeriod();

  const historyPeriods = Array.from({ length: 6 }, (_, index) => shiftPeriod(period, index - 5));

  const [{ count: clients }, { count: invoices }, totals, history] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("billing_period", period),
    supabase
      .from("invoices")
      .select("subtotal,tax_amount,irpf_amount,total_amount")
      .eq("billing_period", period),
    supabase
      .from("invoices")
      .select("billing_period,total_amount")
      .in("billing_period", historyPeriods),
  ]);

  const sum = (field: "subtotal" | "tax_amount" | "irpf_amount" | "total_amount") =>
    (totals.data ?? []).reduce((acc, row) => acc + Number(row[field]), 0);

  const historyMap = new Map(historyPeriods.map((item) => [item, 0]));
  for (const row of history.data ?? []) {
    const key = row.billing_period as string;
    if (historyMap.has(key)) {
      historyMap.set(key, (historyMap.get(key) ?? 0) + Number(row.total_amount));
    }
  }
  const historyPoints = historyPeriods.map((item) => ({ period: item, total: historyMap.get(item) ?? 0 }));
  const periodsWithData = historyPoints.filter((point) => point.total > 0).length;
  const showChart = periodsWithData >= 2;

  return (
    <>
      <PageHeader
        title="Panel de facturación"
        description="Resumen de la actividad financiera de Aibe Technologies"
        actions={<MonthPicker defaultValue={period} label="Ver periodo" />}
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Clientes activos" value={clients ?? 0} icon={Users} tone="navy" />
        <StatCard
          label="Facturas del mes"
          value={invoices ?? 0}
          icon={FileText}
          tone="primary"
          hint={periodLabel(period, { capitalize: true })}
        />
        <StatCard
          label="Facturación del mes"
          value={formatEuro(sum("total_amount"))}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Impuestos repercutidos"
          value={formatEuro(sum("tax_amount"))}
          icon={Percent}
          tone="primary"
        />
        <StatCard
          label="IRPF retenido"
          value={formatEuro(sum("irpf_amount"))}
          icon={HandCoins}
          tone="warning"
        />
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Resumen fiscal"
            description="Base imponible, impuestos e IRPF del periodo seleccionado"
          />
          <CardBody>
            <p className="mb-4 text-[12.5px] text-muted">
              Base imponible + impuestos repercutidos − IRPF retenido = total facturado
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FiscalFigure label="Base imponible" value={formatEuro(sum("subtotal"))} />
              <FiscalFigure label="Impuestos" value={formatEuro(sum("tax_amount"))} />
              <FiscalFigure label="IRPF retenido" value={`− ${formatEuro(sum("irpf_amount"))}`} tone="warning" />
              <FiscalFigure label="Total facturado" value={formatEuro(sum("total_amount"))} tone="primary" />
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Evolución mensual" description="Facturación total de los últimos 6 meses" />
          <CardBody>
            {showChart ? (
              <MonthlyChart points={historyPoints} />
            ) : (
              <p className="py-8 text-center text-[13px] text-muted">
                Todavía no hay suficiente histórico para mostrar la evolución mensual.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Acciones rápidas"
          description="Los atajos más habituales de la gestión mensual"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LinkButton
              href="/dashboard/clientes/nuevo"
              variant="secondary"
              className="h-auto flex-col items-start gap-2 px-4 py-3.5 text-left"
            >
              <Plus className="size-4 text-primary" />
              <span className="text-[13.5px] font-semibold text-ink">Añadir cliente</span>
            </LinkButton>

            <LinkButton
              href="/dashboard/facturas"
              variant="secondary"
              className="h-auto flex-col items-start gap-2 px-4 py-3.5 text-left"
            >
              <FileText className="size-4 text-primary" />
              <span className="text-[13.5px] font-semibold text-ink">Ver facturas</span>
            </LinkButton>

            <form action={generateMonthInvoices} className="contents">
              <input type="hidden" name="period" value={period} />
              <SubmitButton
                variant="secondary"
                className="h-auto w-full flex-col items-start gap-2 px-4 py-3.5 text-left"
                pendingText="Generando…"
              >
                <Sparkles className="size-4 text-primary" />
                <span className="text-[13.5px] font-semibold text-ink">Generar facturas del mes</span>
              </SubmitButton>
            </form>

            <LinkButton
              href="/dashboard/exportaciones"
              variant="secondary"
              className="h-auto flex-col items-start gap-2 px-4 py-3.5 text-left"
            >
              <BadgeEuro className="size-4 text-primary" />
              <span className="text-[13.5px] font-semibold text-ink">Exportar</span>
            </LinkButton>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function FiscalFigure({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "primary" | "warning";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-ink";

  return (
    <div>
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className={`mt-1 text-[15px] font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}
