import type { ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/ui";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-colors duration-150 select-none whitespace-nowrap " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-xs hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-white text-ink border border-border-strong shadow-xs hover:bg-bg hover:border-muted-soft active:bg-border/40",
  ghost: "bg-transparent text-muted hover:bg-black/[0.04] hover:text-ink",
  danger: "bg-danger text-white shadow-xs hover:bg-red-700 active:bg-red-800",
  "danger-ghost": "bg-transparent text-danger hover:bg-danger-soft",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(base, sizes[size], variants[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

type LinkButtonProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

const iconButtonBase = (variant: ButtonVariant, className?: string) =>
  cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "ghost" && "text-muted hover:bg-black/[0.05] hover:text-ink",
    variant === "danger-ghost" && "text-danger hover:bg-danger-soft",
    variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
    className
  );

/** Botón de icono cuadrado, para acciones compactas dentro de filas de tabla. */
export function IconButton({
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={iconButtonBase(variant, className)} {...props} />;
}

/** Igual que IconButton pero como enlace (next/link), para navegar en vez de enviar un formulario. */
export function IconLinkButton({
  variant = "ghost",
  className,
  ...props
}: LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }) {
  return <Link className={iconButtonBase(variant, className)} {...props} />;
}
