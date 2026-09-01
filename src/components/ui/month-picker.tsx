import { CalendarDays } from "lucide-react";
import { Input } from "./field";
import { Button } from "./button";

/**
 * Selector de periodo mensual. Es un <form method="get">, igual que el
 * filtro que ya existía en la página de facturas: no añade lógica nueva,
 * solo cambia el parámetro ?month= de la URL de la página actual.
 */
export function MonthPicker({
  defaultValue,
  paramName = "month",
  label = "Cambiar mes",
}: {
  defaultValue: string;
  paramName?: string;
  label?: string;
}) {
  return (
    <form method="get" className="flex items-center gap-2">
      <div className="relative">
        <CalendarDays
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          name={paramName}
          type="month"
          defaultValue={defaultValue}
          className="w-[168px] pl-9"
        />
      </div>
      <Button type="submit" variant="secondary" size="md">
        {label}
      </Button>
    </form>
  );
}
