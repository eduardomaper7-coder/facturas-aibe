import { periodLabel } from "@/lib/ui";

type MonthlyPoint = { period: string; total: number };

/**
 * Gráfica de barras mínima, sin librerías externas, para la evolución
 * mensual de facturación. Recibe los totales ya agregados desde la
 * página (misma tabla "invoices" que el resto del panel).
 */
export function MonthlyChart({ points }: { points: MonthlyPoint[] }) {
  const max = Math.max(...points.map((point) => point.total), 1);
  const width = 560;
  const height = 148;
  const barGap = 18;
  const barWidth = (width - barGap * (points.length - 1)) / points.length;
  const baseline = height - 24;
  const topPadding = 14;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-40 w-full"
      role="img"
      aria-label="Evolución mensual de facturación"
    >
      <line
        x1={0}
        y1={baseline + 0.5}
        x2={width}
        y2={baseline + 0.5}
        stroke="var(--color-border)"
        strokeWidth={1}
      />

      {points.map((point, index) => {
        const x = index * (barWidth + barGap);
        const usableHeight = baseline - topPadding;
        const barHeight = point.total <= 0 ? 0 : Math.max((point.total / max) * usableHeight, 3);
        const y = baseline - barHeight;
        const isLast = index === points.length - 1;

        return (
          <g key={point.period}>
            <title>
              {periodLabel(point.period, { capitalize: true })}: {point.total.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </title>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={isLast ? "var(--color-primary)" : "var(--color-primary-soft)"}
            />
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--color-muted)"
            >
              {periodLabel(point.period).slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
