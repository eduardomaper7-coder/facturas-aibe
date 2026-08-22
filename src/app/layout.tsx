import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facturas AIBE",
  description: "Panel de facturación de AIBE",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
