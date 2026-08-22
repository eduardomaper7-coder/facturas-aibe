import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Invoice = {
  invoice_number: string;
  issue_date: string;
  seller_snapshot: Record<string, string>;
  client_snapshot: Record<string, string>;
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

const euro = (value: number | string) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));

const wrapText = (
  text: string,
  font: import("pdf-lib").PDFFont,
  fontSize: number,
  maxWidth: number
) => {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
};

export async function createInvoicePdf(invoice: Invoice) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  const text = (
    value: string,
    x: number,
    y: number,
    size = 10,
    isBold = false
  ) =>
    page.drawText(value || "", {
      x,
      y,
      size,
      font: isBold ? bold : regular,
      color: rgb(0.08, 0.12, 0.2),
    });

  text("FACTURA", 45, height - 55, 24, true);
  text(invoice.invoice_number, 45, height - 78, 11);
  text(`Fecha: ${invoice.issue_date}`, 45, height - 94, 10);

  const seller = invoice.seller_snapshot;
  const client = invoice.client_snapshot;

  // Logo situado en la esquina superior derecha
  const logoUrl = seller.logo_url;

  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl);

      if (!logoResponse.ok) {
        throw new Error(
          `No se pudo descargar el logo: ${logoResponse.status}`
        );
      }

      const logoBytes = await logoResponse.arrayBuffer();
      const contentType =
        logoResponse.headers.get("content-type")?.toLowerCase() ?? "";

      const logoImage = contentType.includes("png")
        ? await pdf.embedPng(logoBytes)
        : await pdf.embedJpg(logoBytes);

      const maxWidth = 130;
      const maxHeight = 65;

      const scale = Math.min(
        maxWidth / logoImage.width,
        maxHeight / logoImage.height
      );

      const logoWidth = logoImage.width * scale;
      const logoHeight = logoImage.height * scale;

      page.drawImage(logoImage, {
        x: width - 45 - logoWidth,
        y: height - 45 - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      console.error("No se pudo cargar el logo de la factura:", error);
    }
  }

  text("EMISOR", 45, height - 145, 11, true);
  text(seller.legal_name || seller.trade_name, 45, height - 162);
  text(`NIF: ${seller.tax_id || ""}`, 45, height - 177);
  text(seller.address || "", 45, height - 192);
  text(
    `${seller.postal_code || ""} ${seller.city || ""}`,
    45,
    height - 207
  );
  text(`Tel: ${seller.phone || "699 30 18 19"}`, 45, height - 222);

  text("CLIENTE", 320, height - 145, 11, true);
  text(client.business_name || "", 320, height - 162);
  text(`NIF: ${client.tax_id || ""}`, 320, height - 177);
  text(client.address || "", 320, height - 192);
  text(
    `${client.postal_code || ""} ${client.city || ""}`,
    320,
    height - 207
  );

  const tableTop = height - 260;

  const descMaxWidth = width - 110;
  const descLineHeight = 12;
  const descLines = wrapText(
    invoice.service_description || "",
    regular,
    9,
    descMaxWidth
  );
  const boxHeight = Math.max(105, 48 + descLines.length * descLineHeight + 15);

  page.drawRectangle({
    x: 45,
    y: tableTop - boxHeight,
    width: width - 90,
    height: boxHeight,
    borderWidth: 1,
    borderColor: rgb(0.8, 0.82, 0.86),
  });

  text("Servicio", 55, tableTop - 20, 10, true);
  text("Base", width - 120, tableTop - 20, 10, true);

  text(invoice.service_name, 55, tableTop - 48, 11, true);

  let descY = tableTop - 67;
  for (const line of descLines) {
    text(line, 55, descY, 9);
    descY -= descLineHeight;
  }

  text(euro(invoice.subtotal), width - 130, tableTop - 48, 10);

  let y = tableTop - boxHeight - 40;

  text("Base imponible", 320, y);
  text(euro(invoice.subtotal), 465, y, 10, true);
  y -= 22;

  text(`${invoice.tax_type} ${invoice.tax_rate}%`, 320, y);
  text(euro(invoice.tax_amount), 465, y, 10, true);
  y -= 22;

  text(`Retención IRPF ${invoice.irpf_rate}%`, 320, y);
  text(`-${euro(invoice.irpf_amount)}`, 465, y, 10, true);
  y -= 28;

  text("TOTAL A PAGAR", 320, y, 12, true);
  text(euro(invoice.total_amount), 455, y, 13, true);

  text(`Forma de pago: ${invoice.payment_method}`, 45, 180, 10);

  const isStripe =
    invoice.payment_method.trim().toLowerCase() === "stripe";

  if (seller.iban && !isStripe) {
    text(`IBAN: ${seller.iban}`, 45, 163, 10);
  }

  text(
    seller.footer_text || "Gracias por su confianza",
    45,
    90,
    12,
    true
  );

  return Buffer.from(await pdf.save());
}
