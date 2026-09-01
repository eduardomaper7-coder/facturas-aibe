import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { ImapFlow } from "imapflow";
import { createInvoicePdf } from "@/lib/pdf";

/*
 * Envío de facturas por correo desde info@aibetech.es (Hostinger), vía
 * SMTP normal (nodemailer) — no cuenta de servicio, no OAuth, solo
 * usuario y contraseña del propio buzón. Se usa tanto desde el cron
 * diario (facturas generadas automáticamente) como desde el botón manual
 * "Generar facturas del mes" y desde el botón de reenvío del panel.
 *
 * Tras cada envío correcto, se guarda además una copia idéntica del
 * correo en la carpeta "Enviados" (INBOX.Sent) del buzón vía IMAP, para
 * que se pueda verificar el envío directamente desde el webmail de
 * Hostinger — un envío por SMTP puro, como el que hace nodemailer, no
 * queda copiado ahí automáticamente (eso solo lo hace el propio cliente
 * de correo al redactar). Si ese guardado falla, no afecta al resultado
 * del envío: la factura ya se entregó igualmente.
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

/*
 * Guarda en INBOX.Sent una copia exacta del correo que se acaba de enviar
 * por SMTP, para que aparezca en "Enviados" en el webmail de Hostinger.
 * Usa el mismo usuario/contraseña que el SMTP (IMAP_USER/IMAP_PASSWORD
 * permiten sobreescribirlo si algún día hiciera falta). Nunca lanza: un
 * fallo aquí solo se registra en consola, no debe tumbar el envío ya
 * hecho.
 */
async function guardarCopiaEnEnviados(mailOptions: Record<string, any>) {
  const host = process.env.IMAP_HOST || "imap.hostinger.com";
  const port = Number(process.env.IMAP_PORT ?? 993);
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD;

  if (!user || !pass) return;

  let client: ImapFlow | null = null;

  try {
    const composer = new MailComposer(mailOptions);
    const raw: Buffer = await new Promise((resolve, reject) => {
      composer.compile().build((err: Error | null, message: Buffer) => {
        if (err) reject(err);
        else resolve(message);
      });
    });

    client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    await client.connect();
    await client.append("INBOX.Sent", raw, ["\\Seen"]);
  } catch (err) {
    console.warn(
      "No se pudo guardar la copia en Enviados (el correo sí se envió):",
      err instanceof Error ? err.message : err
    );
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch {
        // ignoramos errores al cerrar la conexión IMAP
      }
    }
  }
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

    const mailOptions = {
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
      messageId: `<${invoice.invoice_number}.${Date.now()}@aibetech.es>`,
    };

    await transporter.sendMail(mailOptions);

    await guardarCopiaEnEnviados(mailOptions);

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
