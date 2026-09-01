import { cn } from "@/lib/ui";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse-soft rounded-md bg-border", className)}
      aria-hidden="true"
    />
  );
}
