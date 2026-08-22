export const metadata = {
  title: "Política de privacidad — Facturas AIBE",
};

export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 20px", lineHeight: 1.6 }}>
      <h1>Política de privacidad</h1>

      <p>
        Facturas AIBE es una herramienta interna de gestión de facturación para
        AIBE Technologies. No es una aplicación pública ni está dirigida a
        terceros: la utiliza exclusivamente el titular del negocio para emitir,
        consultar y organizar sus propias facturas.
      </p>

      <h2>Qué datos trata</h2>
      <p>
        La aplicación almacena datos de clientes y facturas (nombre del
        negocio, importes, fechas, NIF) introducidos por el propio titular,
        en una base de datos privada (Supabase) a la que solo él tiene acceso.
      </p>

      <h2>Uso de la API de Google</h2>
      <p>
        La aplicación se conecta a Google Drive y Google Sheets, mediante
        autorización OAuth otorgada directamente por el titular de la cuenta
        de Google, únicamente para: (1) subir los PDF de sus propias facturas
        a carpetas de su propio Google Drive, y (2) escribir el enlace a cada
        factura en una columna de una hoja de cálculo de su propiedad. No se
        accede a ningún otro archivo, ni se comparte, vende o cede a terceros
        ningún dato obtenido a través de estas APIs. El uso que hace esta
        aplicación de los datos de Google respeta la{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          Política de datos de usuario de los servicios de API de Google
        </a>
        , incluidos los requisitos de uso limitado.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier consulta sobre esta política:{" "}
        <a href="mailto:aibe.technologies7@gmail.com">
          aibe.technologies7@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
