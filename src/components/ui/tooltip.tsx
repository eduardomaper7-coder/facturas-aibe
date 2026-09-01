import { cn } from "@/lib/ui";

/**
 * Tooltip puramente CSS (sin JS): se apoya en group-hover/group-focus,
 * así que funciona igual dentro de Server Components.
 */
export function Tooltip({
  label,
  children,
  className,
  side = "top",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-20 w-max max-w-64 -translate-x-1/2 rounded-lg bg-navy px-2.5 py-1.5 text-[12px] leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
