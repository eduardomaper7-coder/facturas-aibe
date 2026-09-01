"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/ui";

/**
 * Banner de confirmación controlado por un parámetro de la URL
 * (p. ej. ?saved=1 tras una redirección desde una Server Action).
 * Puramente visual: no lee ni escribe datos de negocio.
 */
export function SavedBanner({
  param,
  message,
  className,
}: {
  param: string;
  message: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(searchParams.get(param) != null);
  }, [searchParams, param]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 4500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setVisible(false);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "mb-5 flex items-center gap-2.5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-[13.5px] font-medium text-success animate-fade-in",
        className
      )}
    >
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-0.5 text-success/70 transition-colors hover:bg-success/10 hover:text-success"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
