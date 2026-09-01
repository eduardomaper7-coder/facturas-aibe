"use client";

import { ChevronDown, Download, FileSpreadsheet, HardDrive } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { DropdownMenu, MenuLinkItem } from "@/components/ui/dropdown-menu";
import { pasarADriveYExcel } from "./actions";

/**
 * Agrupa las dos acciones de exportación existentes (Google Sheets y
 * Drive + Excel) en un único menú "Exportar", sin tocar las Server
 * Actions ni las rutas que ya funcionaban.
 */
export function ExportMenu({ period }: { period: string }) {
  return (
    <DropdownMenu
      align="end"
      triggerClassName={buttonClasses("secondary", "md")}
      trigger={
        <>
          <Download className="size-4" />
          Exportar
          <ChevronDown className="size-3.5 text-muted" />
        </>
      }
    >
      {() => (
        <>
          <MenuLinkItem icon={FileSpreadsheet} href={`/api/google-sheets?period=${period}`}>
            Google Sheets
          </MenuLinkItem>

          <form action={pasarADriveYExcel}>
            <input type="hidden" name="period" value={period} />
            <button
              type="submit"
              title="Sube los PDF de las facturas de este mes a la carpeta de Drive del mes (sin duplicados) y enlaza cada una en la columna G de la hoja de cálculo del mes."
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition-colors duration-100 hover:bg-bg"
            >
              <HardDrive className="size-4 shrink-0" />
              Drive y Excel
            </button>
          </form>
        </>
      )}
    </DropdownMenu>
  );
}
