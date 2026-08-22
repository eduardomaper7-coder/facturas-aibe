"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { issueDateForPeriod } from "@/lib/dates";
import { pasarFacturasADriveYExcel } from "@/lib/drive-invoices";
import { enviarYRegistrarFacturaPorCorreo } from "@/lib/email";

const BUSINESS_TIME_ZONE = "Atlantic/Canary";

type SubscriptionRow = {
  id: string;
  renewal_day: number;
  clients:
  | {
    business_name: string;
  }
  | {
    business_name: string;
  }[]
  | null;
};

function getToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getBusinessName(subscription: SubscriptionRow): string {
  if (Array.isArray(subscription.clients)) {
    return subscription.clients[0]?.business_name ?? "";
  }

  return subscription.clients?.business_name ?? "";
}

export async function generateMonthInvoices(formData: FormData) {
  const period = String(formData.get("period") ?? "");

  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Periodo no válido");
  }

  const { user, supabase } = await requireUser();
  const today = getToday();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      renewal_day,
      clients!inner (
        business_name
      )
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .eq("clients.active", true);

  if (error) {
    throw new Error(error.message);
  }

  const subscriptions = ((data ?? []) as SubscriptionRow[])
    .map((subscription) => ({
      ...subscription,
      issueDate: issueDateForPeriod(
        period,
        subscription.renewal_day
      ),
    }))
    /*
     * Solo se generan facturas cuya fecha de emisión
     * sea hoy o una fecha anterior.
     *
     * Las fechas YYYY-MM-DD pueden compararse como texto.
     */
    .filter((subscription) => subscription.issueDate <= today)
    /*
     * Primero por fecha de emisión y, en caso de empate,
     * por nombre del cliente.
     */
    .sort((a, b) => {
      const dateComparison = a.issueDate.localeCompare(b.issueDate);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return getBusinessName(a).localeCompare(
        getBusinessName(b),
        "es",
        {
          sensitivity: "base",
        }
      );
    });

  for (const subscription of subscriptions) {
    const { data: invoiceId, error: issueError } = await supabase.rpc(
      "issue_subscription_invoice",
      {
        p_subscription_id: subscription.id,
        p_issue_date: subscription.issueDate,
        p_billing_period: period,
      }
    );

    if (
      issueError &&
      !issueError.message.toLowerCase().includes("duplicate")
    ) {
      throw new Error(issueError.message);
    }

    /*
     * Si la factura se acaba de crear (no era un duplicado), se envía por
     * correo en el momento de la emisión. El resultado (enviada / sin
     * correo / error) queda registrado en la propia factura para que el
     * panel lo muestre.
     */
    if (!issueError && invoiceId) {
      await enviarYRegistrarFacturaPorCorreo(supabase, invoiceId as string);
    }
  }

  revalidatePath("/dashboard/facturas");
}

/*
 * El borrado ya no es un simple DELETE: pasa por la función
 * delete_invoice() de la base de datos, que borra la factura y
 * renumera al instante todas las posteriores para cerrar el hueco,
 * así la numeración correlativa (0001, 0002, 0003...) nunca tiene
 * saltos. La tabla ya no admite un DELETE directo desde el cliente
 * (bloqueado a nivel de base de datos), así que esta es la única vía.
 */
export async function deleteInvoice(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");

  if (!invoiceId) {
    throw new Error("No se ha indicado la factura");
  }

  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("delete_invoice", {
    p_invoice_id: invoiceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/facturas");
}

/*
 * Sube las facturas del mes a Drive (carpeta "Facturas Ingresos {Mes}
 * {Año}", evitando duplicados) y enlaza cada una en la columna G de la
 * hoja "AA Factura Ingreso {Mes} {Año}" (el resto de columnas no se toca).
 * El resultado se pasa por la URL para mostrar un resumen en la página.
 */
export async function pasarADriveYExcel(formData: FormData) {
  const period = String(formData.get("period") ?? "");

  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Periodo no válido");
  }

  const { supabase } = await requireUser();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("billing_period", period)
    .order("issue_date");

  if (error) {
    throw new Error(error.message);
  }

  const resumen = await pasarFacturasADriveYExcel(period, invoices ?? []);

  revalidatePath("/dashboard/facturas");

  const params = new URLSearchParams({
    month: period,
    drive: "1",
    subidas: String(resumen.subidas),
    existian: String(resumen.yaExistian),
    enlazadas: String(resumen.enlazadas),
    sinMatch: String(resumen.sinCoincidencia),
    ambiguas: String(resumen.ambiguas),
    sheet: resumen.sheetEncontrada ? "1" : "0",
  });

  redirect(`/dashboard/facturas?${params.toString()}`);
}

/*
 * Reenvía por correo una factura ya emitida, para cuando el envío
 * automático falló (queda registrado el error) o simplemente se quiere
 * volver a mandar. Deja constancia del resultado en la propia factura.
 */
export async function reenviarFacturaCorreo(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");

  if (!invoiceId) {
    throw new Error("No se ha indicado la factura");
  }

  const { supabase } = await requireUser();

  await enviarYRegistrarFacturaPorCorreo(supabase, invoiceId);

  revalidatePath("/dashboard/facturas");
}