import { currentPeriod } from "@/lib/dates";

export default function ExportacionesPage() {
  const period = currentPeriod();

  return (
    <>
      <h1>Exportaciones</h1>
      <div className="card">
        <p>Crea una hoja de Google Sheets con las facturas, los importes y los totales del mes.</p>
        <a className="button" href={`/api/google-sheets?period=${period}`}>
          Crear Google Sheet de {period}
        </a>
      </div>
    </>
  );
}
