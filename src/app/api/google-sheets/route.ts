import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMonthlySpreadsheet } from "@/lib/google-sheets";

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return new NextResponse("Periodo no válido", { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("billing_period", period)
    .order("issue_date");

  if (error) return new NextResponse(error.message, { status: 500 });
  const url = await createMonthlySpreadsheet(period, invoices ?? []);
  return NextResponse.redirect(url);
}
