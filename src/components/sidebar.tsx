import Link from "next/link";
import { logout } from "@/app/login/actions";

const links = [
  ["/dashboard", "Inicio"],
  ["/dashboard/clientes", "Clientes"],
  ["/dashboard/facturas", "Facturas"],
  ["/dashboard/empresa", "Datos de empresa"],
  ["/dashboard/exportaciones", "Exportaciones"],
];

export function Sidebar() {
  return (
    <aside style={{
      width: 240, minHeight: "100vh", background: "#111827",
      color: "white", padding: 24, position: "sticky", top: 0
    }}>
      <h2 style={{ marginTop: 0 }}>AIBE</h2>
      <nav className="grid" style={{ gap: 8 }}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} style={{ padding: "10px 0" }}>
            {label}
          </Link>
        ))}
      </nav>
      <form action={logout} style={{ marginTop: 32 }}>
        <button className="secondary" type="submit">Cerrar sesión</button>
      </form>
    </aside>
  );
}
