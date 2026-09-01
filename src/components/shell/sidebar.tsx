"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/ui";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/facturas", label: "Facturas", icon: FileText },
  { href: "/dashboard/empresa", label: "Datos de empresa", icon: Building2 },
  { href: "/dashboard/exportaciones", label: "Exportaciones", icon: Download },
];

export function Sidebar({
  email,
  open,
  onClose,
}: {
  email: string | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="flex flex-col gap-2">
            <Image
              src="/aibe-logo.png"
              alt="Aibe Technologies"
              width={124}
              height={48}
              priority
              className="h-8 w-auto"
            />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-soft">
              Facturación
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-bg md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-navy/70 hover:bg-bg hover:text-navy"
                )}
              >
                <Icon
                  className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-muted-soft")}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-4">
          {email && (
            <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <UserAvatar email={email} size="sm" />
              <span className="min-w-0 truncate text-[12.5px] font-medium text-navy/80">
                {email}
              </span>
            </div>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
            >
              <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
