import nodemailer from "nodemailer";
import { createInvoicePdf } from "@/lib/pdf";

/*
 * Envío de facturas por correo desde info@aibetech.es (Hostinger), vía
 * SMTP normal (nodemailer) — no cuenta de servicio, no OAuth, solo
 * usuario y contraseña del propio buzón. Se usa tanto desde el cron
 * diario (facturas generadas automáticamente) como desde el botón manual
 * "Generar facturas del mes" y desde el botón de reenvío del panel.
 */

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Faltan las credenciales SMTP (SMTP_HOST / SMTP_USER / SMTP_PASSWORD)"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

type InvoiceForEmail = {
  invoice_number: string;
  issue_date: string;
  seller_snapshot: Record<string, any>;
  client_snapshot: Record<string, any>;
  service_name: string;
  service_description: string;
  payment_method: string;
  subtotal: number | string;
  tax_type: string;
  tax_rate: number | string;
  tax_amount: number | string;
  irpf_rate: number | string;
  irpf_amount: number | string;
  total_amount: number | string;
};

export type ResultadoEnvioCorreo =
  | { enviado: true }
  | { enviado: false; motivo: "sin_correo" }
  | { enviado: false; motivo: "error"; error: string };

/*
 * Cliente Supabase mínimo que necesitamos aquí (tanto el cliente de sesión
 * de usuario como el cliente admin del cron cumplen esta forma), para poder
 * reutilizar esta función desde cualquiera de los dos sitios.
 */
type SupabaseLike = {
  from: (table: string) => any;
};

export async function enviarFacturaPorCorreo(
  invoice: InvoiceForEmail
): Promise<ResultadoEnvioCorreo> {
  const email = String(invoice.client_snapshot?.email ?? "").trim();

  if (!email) {
    return { enviado: false, motivo: "sin_correo" };
  }

  try {
    const pdf = await createInvoicePdf(invoice as any);
    const transporter = getTransporter();

    const seller = invoice.seller_snapshot ?? {};
    const nombreEmisor =
      seller.trade_name || seller.legal_name || "AIBE Technologies";

    await transporter.sendMail({
      from: `"${nombreEmisor}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Factura ${invoice.invoice_number}`,
      text:
        `Buenas,\n\n` +
        `Adjuntamos la factura ${invoice.invoice_number} correspondiente a ` +
        `${invoice.service_name} (${invoice.issue_date}).\n\n` +
        `Gracias por su confianza.\n\n${nombreEmisor}`,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdf,
        },
      ],
    });

    return { enviado: true };
  } catch (err) {
    return {
      enviado: false,
      motivo: "error",
      error:
        err instanceof Error
          ? err.message
          : "Error desconocido al enviar el correo",
    };
  }
}

/*
 * Busca la factura por id, envía el correo y deja constancia del resultado
 * en la propia fila (email_sent_at / email_error), para que el panel pueda
 * mostrar "Factura Enviada Correctamente por correo" o el error. Se usa
 * desde el botón manual "Generar facturas del mes", desde el cron diario y
 * desde el botón de reenvío del panel.
 */
export async function enviarYRegistrarFacturaPorCorreo(
  supabase: SupabaseLike,
  invoiceId: string
): Promise<ResultadoEnvioCorreo> {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number,issue_date,seller_snapshot,client_snapshot,service_name,service_description,payment_method,subtotal,tax_type,tax_rate,tax_amount,irpf_rate,irpf_amount,total_amount"
    )
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return {
      enviado: false,
      motivo: "error",
      error:
        error?.message ??
        "No se encontró la factura para enviar el correo",
    };
  }

  const resultado = await enviarFacturaPorCorreo(
    invoice as InvoiceForEmail
  );

  if (resultado.enviado) {
    await supabase
      .from("invoices")
      .update({
        email_sent_at: new Date().toISOString(),
        email_error: null,
      })
      .eq("id", invoiceId);
  } else if (resultado.motivo === "error") {
    await supabase
      .from("invoices")
      .update({ email_error: resultado.error })
      .eq("id", invoiceId);
  }

  return resultado;
}
