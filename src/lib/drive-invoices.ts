import { google } from "googleapis";
import { Readable } from "stream";
import { createInvoicePdf } from "@/lib/pdf";

/*
 * Las cuentas de servicio tienen 0 bytes de cuota de almacenamiento propia:
 * pueden crear hojas de cálculo (formato nativo de Google, exento de cuota)
 * pero NO pueden crear archivos binarios como un PDF dentro de una carpeta
 * normal de Drive (solo dentro de una Unidad compartida, que requiere
 * Google Workspace). Por eso aquí NO se usa la cuenta de servicio: se sube
 * y se gestiona todo con OAuth, autenticado como el propio dueño de la
 * carpeta "AA 2026" (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET /
 * GOOGLE_OAUTH_REFRESH_TOKEN), que sí tiene cuota real.
 */
function getUploadAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan las credenciales OAuth de Google (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN)"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/*
 * Sube al Drive las facturas de un mes ("Facturas Ingresos {Mes} {Año}",
 * dentro de "{Mes} {Año}", dentro de la carpeta raíz GOOGLE_DRIVE_AA_ROOT_ID)
 * evitando duplicados, y enlaza cada factura en la columna G de la hoja
 * "AA Factura Ingreso {Mes} {Año}" del mismo mes, sin tocar el resto de
 * columnas. El emparejamiento con la hoja se hace por importe (columna C =
 * Ingreso Bruto = subtotal + impuesto recaudado), no por nombre, porque los
 * nombres de la hoja y los del cliente en la app no siempre coinciden
 * exactamente.
 */

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export type InvoiceForDrive = {
  id: string;
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

export type SubidaResumen = {
  subidas: number;
  yaExistian: number;
  enlazadas: number;
  sinCoincidencia: number;
  ambiguas: number;
  sheetEncontrada: boolean;
  carpetaUrl: string;
};

function nombreMes(period: string) {
  const [anio, mesNum] = period.split("-");
  const mes = MESES[Number(mesNum)];
  if (!mes) throw new Error(`Periodo no válido: ${period}`);
  return { mes, anio };
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Extrae el número de secuencia (p.ej. "0079" -> 79) de un invoice_number.
function secuencia(invoiceNumber: string) {
  const match = invoiceNumber.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ¿El nombre de un archivo ya existente en Drive contiene ese número de
// factura como token propio (no como parte de otro número más largo)?
function contieneSecuencia(fileName: string, seq: number) {
  const padded4 = String(seq).padStart(4, "0");
  const patterns = [padded4, String(seq)];
  return patterns.some((p) => {
    const re = new RegExp(`(^|[^0-9])${p}([^0-9]|$)`);
    return re.test(fileName);
  });
}

function buildFileName(invoice: InvoiceForDrive) {
  const client = String(invoice.client_snapshot?.business_name ?? "").trim();
  const seller = String(
    invoice.seller_snapshot?.trade_name ?? invoice.seller_snapshot?.legal_name ?? ""
  ).trim();
  const parts = ["FACTURA", invoice.invoice_number, client, seller].filter(Boolean);
  return `${parts.join(" ").replace(/\s+/g, " ").trim()}.pdf`;
}

async function findFolder(drive: any, parentId: string, name: string) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapeDriveQuery(
      name
    )}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1,
  });
  return res.data.files?.[0] ?? null;
}

async function ensureFolder(drive: any, parentId: string, name: string) {
  const found = await findFolder(drive, parentId, name);
  if (found) return found;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, name",
  });
  return created.data;
}

async function findSpreadsheet(drive: any, parentId: string, name: string) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapeDriveQuery(
      name
    )}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1,
  });
  return res.data.files?.[0] ?? null;
}

async function listPdfFiles(drive: any, folderId: string) {
  const files: Array<{ id: string; name: string }> = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType = 'application/pdf'`,
      fields: "nextPageToken, files(id, name)",
      pageSize: 200,
      pageToken,
    });
    files.push(...((res.data.files ?? []) as Array<{ id: string; name: string }>));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

export async function pasarFacturasADriveYExcel(
  period: string,
  invoices: InvoiceForDrive[]
): Promise<SubidaResumen> {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Periodo no válido");
  }

  const rootId = process.env.GOOGLE_DRIVE_AA_ROOT_ID;
  if (!rootId) {
    throw new Error(
      "Falta configurar GOOGLE_DRIVE_AA_ROOT_ID (id de la carpeta 'AA 2026' en Drive)"
    );
  }

  const auth = getUploadAuth();
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  const { mes, anio } = nombreMes(period);
  const monthFolderName = `${mes} ${anio}`;
  const ingresosFolderName = `Facturas Ingresos ${mes} ${anio}`;
  const sheetName = `AA Factura Ingreso ${mes} ${anio}`;

  const monthFolder = await ensureFolder(drive, rootId, monthFolderName);
  const ingresosFolder = await ensureFolder(drive, monthFolder.id, ingresosFolderName);

  const existingFiles = await listPdfFiles(drive, ingresosFolder.id);

  const resumen: SubidaResumen = {
    subidas: 0,
    yaExistian: 0,
    enlazadas: 0,
    sinCoincidencia: 0,
    ambiguas: 0,
    sheetEncontrada: false,
    carpetaUrl: `https://drive.google.com/drive/folders/${ingresosFolder.id}`,
  };

  const invoiceDriveUrl = new Map<string, string>();

  for (const invoice of invoices) {
    const seq = secuencia(invoice.invoice_number);

    const existing =
      seq !== null ? existingFiles.find((f) => contieneSecuencia(f.name, seq)) : undefined;

    if (existing) {
      resumen.yaExistian++;
      invoiceDriveUrl.set(invoice.id, `https://drive.google.com/file/d/${existing.id}/view`);
      continue;
    }

    const pdfBuffer = await createInvoicePdf(invoice as any);
    const fileName = buildFileName(invoice);

    const created = await drive.files.create({
      requestBody: { name: fileName, parents: [ingresosFolder.id] },
      media: { mimeType: "application/pdf", body: bufferToStream(pdfBuffer) },
      fields: "id, name",
    });

    const newFile = { id: created.data.id as string, name: fileName };
    existingFiles.push(newFile);
    resumen.subidas++;
    invoiceDriveUrl.set(invoice.id, `https://drive.google.com/file/d/${newFile.id}/view`);
  }

  // --- Enlazar en la hoja de cálculo (columna G), sin tocar el resto ---
  const spreadsheetFile = await findSpreadsheet(drive, monthFolder.id, sheetName);

  if (!spreadsheetFile) {
    // No se encontró la hoja: no se puede enlazar, pero la subida ya se hizo.
    return resumen;
  }

  resumen.sheetEncontrada = true;
  const spreadsheetId = spreadsheetFile.id as string;

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  const sheetTitle = meta.data.sheets?.[0]?.properties?.title ?? "Hoja 1";

  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetTitle}!A2:G1000`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = valuesRes.data.values ?? [];
  const usedInvoiceIds = new Set<string>();
  const updates: Array<{ range: string; values: string[][] }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const yaTieneEnlace = row[6] !== undefined && row[6] !== null && String(row[6]).trim() !== "";
    if (yaTieneEnlace) continue;

    const brutoRaw = row[2];
    if (brutoRaw === undefined || brutoRaw === null || brutoRaw === "") continue;
    const bruto = Number(brutoRaw);
    if (Number.isNaN(bruto)) continue;

    const candidatos = invoices.filter((invoice) => {
      if (usedInvoiceIds.has(invoice.id)) return false;
      const url = invoiceDriveUrl.get(invoice.id);
      if (!url) return false;
      const importe = round2(Number(invoice.subtotal) + Number(invoice.tax_amount));
      return importe === round2(bruto);
    });

    if (candidatos.length === 1) {
      const invoice = candidatos[0];
      usedInvoiceIds.add(invoice.id);
      updates.push({
        range: `${sheetTitle}!G${rowNumber}`,
        values: [[invoiceDriveUrl.get(invoice.id) as string]],
      });
      resumen.enlazadas++;
    } else if (candidatos.length === 0) {
      resumen.sinCoincidencia++;
    } else {
      resumen.ambiguas++;
    }
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });
  }

  return resumen;
}
