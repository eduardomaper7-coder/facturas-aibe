"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/ui";

export function DropdownMenu({
  trigger,
  triggerClassName,
  align = "end",
  children,
}: {
  trigger?: React.ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={
          triggerClassName ??
          "flex size-8 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }
      >
        {trigger ?? <MoreVertical className="size-4" aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-1.5 w-52 origin-top-right rounded-xl border border-border bg-white p-1.5 shadow-lg animate-fade-in",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon: Icon,
  danger,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100",
        danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-bg",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {props.children}
    </button>
  );
}

export function MenuLinkItem({
  icon: Icon,
  className,
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  icon?: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <a
      role="menuitem"
      href={href}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition-colors duration-100 hover:bg-bg",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {props.children}
    </a>
  );
}
