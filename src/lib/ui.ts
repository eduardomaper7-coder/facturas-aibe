/**
 * Utilidades de presentación puras (sin lógica de negocio).
 * No leen ni escriben datos: solo dan formato a valores que ya
 * vienen calculados desde la base de datos o desde src/lib/*.
 */

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/** Iniciales para el avatar, a partir de un correo o nombre. */
export function initialsFrom(value: string | null | undefined) {
  if (!value) return "?";
  const namePart = value.includes("@") ? value.split("@")[0] : value;
  const pieces = namePart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (pieces.length === 0) return "?";
  if (pieces.length === 1) return pieces[0].slice(0, 2).toUpperCase();
  return (pieces[0][0] + pieces[1][0]).toUpperCase();
}

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-09" -> "septiembre 2026". Solo formato de presentación. */
export function periodLabel(period: string, options?: { capitalize?: boolean }) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const [, year, month] = match;
  const index = Number(month) - 1;
  const name = MONTH_LABELS[index] ?? month;
  const label = `${name} ${year}`;
  return options?.capitalize ? label[0].toUpperCase() + label.slice(1) : label;
}

export function shiftPeriod(period: string, delta: number) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
