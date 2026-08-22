import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, minWidth: 0 }}>{children}</main>
    </div>
  );
}
