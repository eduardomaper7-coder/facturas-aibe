import { google } from "googleapis";

export function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Faltan credenciales de Google");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export async function createMonthlySpreadsheet(
  period: string,
  invoices: Array<Record<string, any>>
) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `Facturas AIBE - ${period}` },
      sheets: [{ properties: { title: "Facturas" } }],
    },
  });

  const spreadsheetId = created.data.spreadsheetId!;
  const rows = invoices.map((invoice) => {
    const client = invoice.client_snapshot ?? {};
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return [
      client.business_name ?? "",
      invoice.invoice_number,
      invoice.issue_date,
      Number(invoice.subtotal),
      invoice.tax_type,
      Number(invoice.tax_rate),
      Number(invoice.tax_amount),
      Number(invoice.irpf_amount),
      Number(invoice.total_amount),
      `${appUrl}/api/invoices/${invoice.id}/pdf`,
    ];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Facturas!A1:J3",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["TOTALES DEL MES", "", "", "=SUM(D4:D)", "", "", "=SUM(G4:G)", "=SUM(H4:H)", "=SUM(I4:I)", ""],
        [],
        ["Nombre del negocio", "Nº factura", "Fecha", "Ingreso bruto", "Tipo impuesto", "% impuesto", "Impuesto a pagar", "IRPF retenido", "Ingreso neto/total cobrado", "Factura"],
      ],
    },
  });

  if (rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Facturas!A4:J${rows.length + 3}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) {
    const file = await drive.files.get({ fileId: spreadsheetId, fields: "parents" });
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      removeParents: file.data.parents?.join(","),
      fields: "id, parents",
    });
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
