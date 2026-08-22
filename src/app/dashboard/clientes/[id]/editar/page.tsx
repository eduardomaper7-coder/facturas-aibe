import Link from "next/link";
import { notFound } from "next/navigation";
import TaxFields from "@/components/tax-fields";
import { requireUser } from "@/lib/auth";
import { updateClientWithSubscription } from "../../actions";

type EditarClientePageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarClientePage({
    params,
}: EditarClientePageProps) {
    const { id } = await params;
    const { user, supabase } = await requireUser();

    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select(`
      id,
      business_name,
      tax_id,
      address,
      postal_code,
      city,
      province,
      country,
      email,
      payment_method,
      active,
      subscriptions (
        id,
        service_name,
        service_description,
        base_amount,
        tax_type,
        tax_rate,
        apply_irpf,
        irpf_rate,
        renewal_day,
        active
      )
    `)
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (clientError) {
        throw new Error(clientError.message);
    }

    if (!client || !client.active) {
        notFound();
    }

    const subscriptions = Array.isArray(client.subscriptions)
        ? client.subscriptions
        : [];

    const subscription =
        subscriptions.find((item) => item.active) ??
        subscriptions[0] ??
        null;

    if (!subscription) {
        throw new Error(
            "Este cliente no tiene ninguna suscripción asociada."
        );
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
                <h1>Editar cliente y suscripción</h1>

                <Link
                    href="/dashboard/clientes"
                    className="button secondary"
                >
                    Volver
                </Link>
            </div>

            <form
                action={updateClientWithSubscription}
                className="card grid"
            >
                <input
                    type="hidden"
                    name="client_id"
                    value={client.id}
                />

                <input
                    type="hidden"
                    name="subscription_id"
                    value={subscription.id}
                />

                <h2>Datos del cliente</h2>

                <div className="grid grid-2">
                    <label>
                        Nombre del negocio
                        <input
                            name="business_name"
                            defaultValue={client.business_name ?? ""}
                            required
                        />
                    </label>

                    <label>
                        NIF/CIF
                        <input
                            name="tax_id"
                            defaultValue={client.tax_id ?? ""}
                            required
                        />
                    </label>

                    <label>
                        Dirección
                        <input
                            name="address"
                            defaultValue={client.address ?? ""}
                            required
                        />
                    </label>

                    <label>
                        Código postal
                        <input
                            name="postal_code"
                            defaultValue={client.postal_code ?? ""}
                        />
                    </label>

                    <label>
                        Municipio
                        <input
                            name="city"
                            defaultValue={client.city ?? ""}
                        />
                    </label>

                    <label>
                        Provincia
                        <input
                            name="province"
                            defaultValue={client.province ?? ""}
                        />
                    </label>

                    <label>
                        País
                        <input
                            name="country"
                            defaultValue={client.country ?? "España"}
                        />
                    </label>

                    <label>
                        Correo
                        <input
                            name="email"
                            type="email"
                            defaultValue={client.email ?? ""}
                        />
                    </label>

                    <label>
                        Forma de pago
                        <select
                            name="payment_method"
                            defaultValue={
                                client.payment_method ??
                                "Transferencia bancaria"
                            }
                        >
                            <option value="Transferencia bancaria">
                                Transferencia bancaria
                            </option>

                            <option value="Domiciliación bancaria">
                                Domiciliación bancaria
                            </option>

                            <option value="Tarjeta">
                                Tarjeta
                            </option>

                            <option value="Efectivo">
                                Efectivo
                            </option>

                            <option value="Stripe">
                                Stripe
                            </option>
                        </select>
                    </label>
                </div>

                <h2>Servicio recurrente</h2>

                <div className="grid grid-2">
                    <label>
                        Nombre del servicio
                        <input
                            name="service_name"
                            defaultValue={subscription.service_name ?? ""}
                            required
                        />
                    </label>

                    <label>
                        Base imponible mensual
                        <input
                            name="base_amount"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={subscription.base_amount ?? 0}
                            required
                        />
                    </label>

                    <label>
                        Descripción
                        <textarea
                            name="service_description"
                            rows={4}
                            defaultValue={
                                subscription.service_description ?? ""
                            }
                        />
                    </label>

                    <TaxFields
                        initialTaxType={subscription.tax_type ?? "IGIC"}
                        initialTaxRate={Number(
                            subscription.tax_rate ?? 7
                        )}
                    />

                    <label>
                        Día de renovación
                        <input
                            name="renewal_day"
                            type="number"
                            min="1"
                            max="31"
                            defaultValue={subscription.renewal_day ?? 1}
                            required
                        />

                        <small>
                            Puede ser del 1 al 31. En meses más cortos se
                            usará automáticamente el último día.
                        </small>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <input
                            name="apply_irpf"
                            type="checkbox"
                            defaultChecked={
                                subscription.apply_irpf ?? false
                            }
                            style={{ width: "auto" }}
                        />

                        Aplicar retención de IRPF
                    </label>

                    <label>
                        Porcentaje de IRPF
                        <input
                            name="irpf_rate"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={subscription.irpf_rate ?? 7}
                            required
                        />
                    </label>
                </div>

                <div
                    className="actions"
                    style={{
                        justifyContent: "flex-end",
                    }}
                >
                    <Link
                        href="/dashboard/clientes"
                        className="button secondary"
                    >
                        Cancelar
                    </Link>

                    <button type="submit">
                        Guardar cambios
                    </button>
                </div>
            </form>
        </>
    );
}