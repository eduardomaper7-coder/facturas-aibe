import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatEuro } from "@/lib/money";
import { deactivateClient } from "./actions";

export default async function ClientesPage() {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from("clients")
    .select(`
      id,
      business_name,
      tax_id,
      email,
      payment_method,
      active,
      subscriptions (
        id,
        service_name,
        base_amount,
        tax_type,
        tax_rate,
        apply_irpf,
        irpf_rate,
        renewal_day,
        active
      )
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <>
      <div
        className="actions"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Clientes</h1>

        <Link
          className="button"
          href="/dashboard/clientes/nuevo"
        >
          Nuevo cliente
        </Link>
      </div>

      <div
        className="card"
        style={{
          overflowX: "auto",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>NIF</th>
              <th>Servicio</th>
              <th>Base</th>
              <th>Impuesto</th>
              <th>IRPF</th>
              <th>Renovación</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {(data ?? []).map((client) => {
              const subscriptions = Array.isArray(
                client.subscriptions
              )
                ? client.subscriptions
                : [];

              const sub =
                subscriptions.find(
                  (subscription) => subscription.active
                ) ?? null;

              return (
                <tr key={client.id}>
                  <td>
                    <strong>{client.business_name}</strong>

                    <br />

                    <small>
                      {client.email || "Sin correo"}
                    </small>
                  </td>

                  <td>{client.tax_id}</td>

                  <td>
                    {sub?.service_name ?? "Sin servicio"}
                  </td>

                  <td>
                    {sub
                      ? formatEuro(sub.base_amount)
                      : "—"}
                  </td>

                  <td>
                    {sub
                      ? `${sub.tax_type} ${sub.tax_rate}%`
                      : "—"}
                  </td>

                  <td>
                    {sub?.apply_irpf
                      ? `${sub.irpf_rate}%`
                      : "No"}
                  </td>

                  <td>
                    {sub
                      ? `Día ${sub.renewal_day}`
                      : "—"}
                  </td>

                  <td>
                    <div
                      className="actions"
                      style={{
                        gap: 8,
                        flexWrap: "nowrap",
                      }}
                    >
                      {sub ? (
                        <Link
                          className="button secondary"
                          href={`/dashboard/clientes/${client.id}/editar`}
                        >
                          Editar
                        </Link>
                      ) : (
                        <span
                          title="Este cliente no tiene una suscripción activa"
                          style={{
                            opacity: 0.55,
                          }}
                        >
                          Sin suscripción
                        </span>
                      )}

                      <form action={deactivateClient}>
                        <input
                          type="hidden"
                          name="client_id"
                          value={client.id}
                        />

                        <button
                          type="submit"
                          className="danger"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}

            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={8}>
                  No hay clientes activos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}