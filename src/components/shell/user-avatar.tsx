import { initialsFrom, cn } from "@/lib/ui";

export function UserAvatar({
  email,
  size = "md",
  className,
}: {
  email: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
        size === "sm" ? "size-7 text-[11px]" : "size-9 text-[13px]",
        className
      )}
      aria-hidden="true"
    >
      {initialsFrom(email)}
    </span>
  );
}
