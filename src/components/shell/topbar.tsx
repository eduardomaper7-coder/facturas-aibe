import { Menu } from "lucide-react";
import { UserAvatar } from "./user-avatar";

export function TopBar({
  email,
  onMenuClick,
}: {
  email: string | null | undefined;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex size-9 items-center justify-center rounded-lg text-navy transition-colors hover:bg-bg md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      <span className="hidden text-[13px] font-medium text-muted md:block">
        Aibe Technologies
      </span>

      <div className="flex items-center gap-2.5">
        <span className="hidden text-[13px] font-medium text-navy/80 sm:block">{email}</span>
        <UserAvatar email={email} size="sm" />
      </div>
    </header>
  );
}
