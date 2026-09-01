"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";
import { cn } from "@/lib/ui";

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pendingText?: string;
};

/**
 * Botón de envío para <form action={serverAction}>. No cambia la
 * acción del formulario: solo usa useFormStatus para mostrar un
 * estado "cargando" mientras la acción del servidor está en curso.
 */
export function SubmitButton({
  variant = "primary",
  size = "md",
  className,
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-busy={pending}
      disabled={disabled || pending}
      className={cn(buttonClasses(variant, size, className))}
      {...props}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
