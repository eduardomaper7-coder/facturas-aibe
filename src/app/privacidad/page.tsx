export const metadata = {
  title: "Política de privacidad — Facturas AIBE",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 leading-relaxed text-ink">
      <h1 className="text-2xl font-semibold tracking-tight">Política de privacidad</h1>

      <p className="mt-4 text-[14.5px] text-ink/90">
        Facturas AIBE es una herramienta interna de gestión de facturación para
        AIBE Technologies. No es una aplicación pública ni está dirigida a
        terceros: la utiliza exclusivamente el titular del negocio para emitir,
        consultar y organizar sus propias facturas.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Qué datos trata</h2>
      <p className="mt-2 text-[14.5px] text-ink/90">
        La aplicación almacena datos de clientes y facturas (nombre del
        negocio, importes, fechas, NIF) introducidos por el propio titular,
        en una base de datos privada (Supabase) a la que solo él tiene acceso.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Uso de la API de Google</h2>
      <p className="mt-2 text-[14.5px] text-ink/90">
        La aplicación se conecta a Google Drive y Google Sheets, mediante
        autorización OAuth otorgada directamente por el titular de la cuenta
        de Google, únicamente para: (1) subir los PDF de sus propias facturas
        a carpetas de su propio Google Drive, y (2) escribir el enlace a cada
        factura en una columna de una hoja de cálculo de su propiedad. No se
        accede a ningún otro archivo, ni se comparte, vende o cede a terceros
        ningún dato obtenido a través de estas APIs. El uso que hace esta
        aplicación de los datos de Google respeta la{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          className="text-primary underline underline-offset-2"
        >
          Política de datos de usuario de los servicios de API de Google
        </a>
        , incluidos los requisitos de uso limitado.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contacto</h2>
      <p className="mt-2 text-[14.5px] text-ink/90">
        Para cualquier consulta sobre esta política:{" "}
        <a
          href="mailto:aibe.technologies7@gmail.com"
          className="text-primary underline underline-offset-2"
        >
          aibe.technologies7@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
