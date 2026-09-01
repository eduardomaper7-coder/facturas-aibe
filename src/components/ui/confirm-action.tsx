"use client";

import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { MenuItem } from "./dropdown-menu";

/**
 * Acción destructiva con confirmación, pensada para vivir dentro de un
 * menú de tres puntos. No cambia la Server Action que recibe: solo
 * intercepta el envío del formulario con un modal de confirmación antes
 * de llamar a formRef.current.requestSubmit().
 */
export function ConfirmSubmitMenuItem({
  action,
  hiddenFields,
  label,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Eliminar",
  icon,
  closeMenu,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  label: string;
  confirmTitle: string;
  confirmDescription: React.ReactNode;
  confirmLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  closeMenu?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <MenuItem
        icon={icon}
        danger
        onClick={() => {
          closeMenu?.();
          setOpen(true);
        }}
      >
        {label}
      </MenuItem>

      <form ref={formRef} action={action} className="hidden">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink">{confirmTitle}</h3>
                <p className="mt-1 text-[13px] text-muted">{confirmDescription}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  formRef.current?.requestSubmit();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Acción no destructiva (p. ej. "Reenviar por correo") dentro de un menú
 * de tres puntos: envía el formulario oculto directamente, sin modal de
 * confirmación.
 */
export function SubmitMenuItem({
  action,
  hiddenFields,
  label,
  icon,
  closeMenu,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  closeMenu?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <MenuItem
        icon={icon}
        onClick={() => {
          closeMenu?.();
          formRef.current?.requestSubmit();
        }}
      >
        {label}
      </MenuItem>

      <form ref={formRef} action={action} className="hidden">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </>
  );
}
