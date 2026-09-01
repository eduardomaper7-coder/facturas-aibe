import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui";

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
  inline,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <label className={cn("flex items-center gap-2.5", className)}>
        {children}
        <span className="text-[13px] font-medium text-ink">{label}</span>
      </label>
    );
  }

  return (
    <label htmlFor={htmlFor} className={cn("grid gap-1.5", className)}>
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-ink " +
  "placeholder:text-muted-soft transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "disabled:cursor-not-allowed disabled:bg-bg disabled:text-muted";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  wrapperClassName,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative block", wrapperClassName)}>
      <select className={cn(fieldBase, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </span>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 rounded border-border-strong text-primary accent-[var(--color-primary)] focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  );
}
