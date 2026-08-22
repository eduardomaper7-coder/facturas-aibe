import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentPeriod, effectiveRenewalDay } from "@/lib/dates";
import { enviarYRegistrarFacturaPorCorreo } from "@/lib/email";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const today = now.getUTCDate();
  const period = currentPeriod(now);
  const admin = createAdminClient();

  const { data: subscriptions, error } = await admin
    .from("subscriptions")
    .select("id,renewal_day")
    .eq("active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let generated = 0;
  const errors: string[] = [];

  for (const subscription of subscriptions ?? []) {
    const effectiveDay = effectiveRenewalDay(year, month, subscription.renewal_day);
    if (effectiveDay !== today) continue;

    const issueDate = `${period}-${String(effectiveDay).padStart(2, "0")}`;
    const { data, error: issueError } = await admin.rpc(
      "issue_subscription_invoice_admin",
      {
        p_subscription_id: subscription.id,
        p_issue_date: issueDate,
        p_billing_period: period,
      }
    );

    if (issueError) {
      errors.push(`${subscription.id}: ${issueError.message}`);
    } else if (data) {
      generated += 1;

      const resultadoCorreo = await enviarYRegistrarFacturaPorCorreo(
        admin,
        data as string
      );

      if (!resultadoCorreo.enviado && resultadoCorreo.motivo === "error") {
        errors.push(
          `${subscription.id}: envío de correo falló - ${resultadoCorreo.error}`
        );
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    period,
    generated,
    errors,
  });
}
