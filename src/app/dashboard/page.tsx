import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { currentPeriod } from "@/lib/dates";
import { formatEuro } from "@/lib/money";

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();
  const period = currentPeriod();

  const [{ count: clients }, { count: invoices }, totals] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("billing_period", period),
    supabase.from("invoices").select("subtotal,tax_amount,irpf_amount,total_amount").eq("billing_period", period),
  ]);

  const sum = (field: "subtotal" | "tax_amount" | "irpf_amount" | "total_amount") =>
    (totals.data ?? []).reduce((acc, row) => acc + Number(row[field]), 0);

  return (
    <>
      <h1>Panel de facturación</h1>
      <p>{user.email} · Periodo {period}</p>

      <section className="grid grid-3">
        <div className="card"><small>Clientes activos</small><h2>{clients ?? 0}</h2></div>
        <div className="card"><small>Facturas del mes</small><h2>{invoices ?? 0}</h2></div>
        <div className="card"><small>Total a cobrar</small><h2>{formatEuro(sum("total_amount"))}</h2></div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Resumen fiscal mensual</h2>
        <p>Base imponible: <strong>{formatEuro(sum("subtotal"))}</strong></p>
        <p>Impuestos repercutidos: <strong>{formatEuro(sum("tax_amount"))}</strong></p>
        <p>IRPF retenido: <strong>{formatEuro(sum("irpf_amount"))}</strong></p>
        <div className="actions">
          <Link className="button" href="/dashboard/clientes/nuevo">Añadir cliente</Link>
          <Link className="button secondary" href="/dashboard/facturas">Ver facturas</Link>
        </div>
      </section>
    </>
  );
}
