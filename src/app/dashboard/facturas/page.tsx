import { requireUser } from "@/lib/auth";
import { currentPeriod } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import {
  deleteInvoice,
  generateMonthInvoices,
  pasarADriveYExcel,
} from "./actions";

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    drive?: string;
    subidas?: string;
    existian?: string;
    enlazadas?: string;
    sinMatch?: string;
    ambiguas?: string;
    sheet?: string;
  }>;
}) {
  const params = await searchParams;

  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : currentPeriod();

  const driveResumen =
    params.drive === "1"
      ? {
          subidas: Number(params.subidas ?? 0),
          existian: Number(params.existian ?? 0),
          enlazadas: Number(params.enlazadas ?? 0),
          sinMatch: Number(params.sinMatch ?? 0),
          ambiguas: Number(params.ambiguas ?? 0),
          sheetEncontrada: params.sheet === "1",
        }
      : null;

  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,invoice_number,issue_date,subtotal,tax_type,tax_rate,tax_amount,irpf_amount,total_amount,status,client_snapshot"
    )
    .eq("billing_period", month)
    .order("issue_date", { ascending: false })
    .order("invoice_number", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <>
      <h1>Facturas — {month}</h1>

      {driveResumen && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            background: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <strong>Facturas enviadas a Drive y Excel</strong>
          <p style={{ marginTop: 6, marginBottom: 0 }}>
            {driveResumen.subidas} subidas nuevas · {driveResumen.existian}{" "}
            ya estaban en Drive · {driveResumen.enlazadas} enlazadas en la
            hoja de cálculo
            {driveResumen.sinMatch > 0 &&
              ` · ${driveResumen.sinMatch} sin fila con ese importe en la hoja`}
            {driveResumen.ambiguas > 0 &&
              ` · ${driveResumen.ambiguas} con importe ambiguo (revisar a mano)`}
            {!driveResumen.sheetEncontrada &&
              " · No se encontró la hoja de cálculo del mes, no se ha podido enlazar nada"}
            .
          </p>
        </div>
      )}

      <div className="card actions" style={{ marginBottom: 20 }}>
        <form method="get" className="actions">
          <input
            name="month"
            type="month"
            defaultValue={month}
            style={{ width: 190 }}
          />

          <button type="submit" className="secondary">
            Cambiar mes
          </button>
        </form>

        <form action={generateMonthInvoices}>
          <input type="hidden" name="period" value={month} />

          <button type="submit">
            Generar facturas del mes
          </button>
        </form>

        <a
          className="button secondary"
          href={`/api/google-sheets?period=${month}`}
        >
          Volcar a Google Sheets
        </a>

        <form action={pasarADriveYExcel}>
          <input type="hidden" name="period" value={month} />

          <button
            type="submit"
            title="Sube los PDF de las facturas de este mes a la carpeta de Drive del mes (sin duplicados) y enlaza cada una en la columna G de la hoja de cálculo del mes."
          >
            Pasar facturas a Drive y Excel
          </button>
        </form>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Emisión</th>
              <th>Cliente</th>
              <th>Base</th>
              <th>Impuesto</th>
              <th>IRPF</th>
              <th>Total</th>
              <th>PDF</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {(data ?? []).map((invoice) => {
              const client = invoice.client_snapshot as {
                business_name?: string;
              };

              return (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.invoice_number}</strong>
                  </td>

                  <td>{invoice.issue_date}</td>

                  <td>{client.business_name}</td>

                  <td>{formatEuro(invoice.subtotal)}</td>

                  <td>
                    {invoice.tax_type} {invoice.tax_rate}% ·{" "}
                    {formatEuro(invoice.tax_amount)}
                  </td>

                  <td>-{formatEuro(invoice.irpf_amount)}</td>

                  <td>
                    <strong>
                      {formatEuro(invoice.total_amount)}
                    </strong>
                  </td>

                  <td>
                    <a
                      className="button secondary"
                      href={`/api/invoices/${invoice.id}/pdf`}
                    >
                      Descargar
                    </a>
                  </td>

                  <td>
                    <form action={deleteInvoice}>
                      <input
                        type="hidden"
                        name="invoice_id"
                        value={invoice.id}
                      />

                      <input
                        type="hidden"
                        name="month"
                        value={month}
                      />

                      <button
                        type="submit"
                        className="danger"
                        title={`Borrar la factura ${invoice.invoice_number}. Las facturas posteriores se renumeran automáticamente para cerrar el hueco.`}
                      >
                        Borrar
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}

            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={9}>
                  No hay facturas para este mes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
