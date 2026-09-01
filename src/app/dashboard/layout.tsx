import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return <AppShell email={user.email}>{children}</AppShell>;
}
