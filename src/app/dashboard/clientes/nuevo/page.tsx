import TaxFields from "@/components/tax-fields";
import { createClientWithSubscription } from "../actions";

export default function NuevoClientePage() {
  return (
    <>
      <h1>Nuevo cliente y suscripción</h1>

      <form action={createClientWithSubscription} className="card grid">
        <h2>Datos del cliente</h2>

        <div className="grid grid-2">
          <label>
            Nombre del negocio
            <input name="business_name" required />
          </label>

          <label>
            NIF/CIF
            <input name="tax_id" required />
          </label>

          <label>
            Dirección
            <input name="address" required />
          </label>

          <label>
            Código postal
            <input name="postal_code" />
          </label>

          <label>
            Municipio
            <input name="city" />
          </label>

          <label>
            Provincia
            <input name="province" />
          </label>

          <label>
            País
            <input name="country" defaultValue="España" />
          </label>

          <label>
            Correo
            <input name="email" type="email" />
          </label>

          <label>
            Forma de pago
            <select
              name="payment_method"
              defaultValue="Transferencia bancaria"
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
            <input name="service_name" required />
          </label>

          <label>
            Base imponible mensual
            <input
              name="base_amount"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </label>

          <label>
            Descripción
            <textarea
              name="service_description"
              rows={4}
            />
          </label>

          <TaxFields />

          <label>
            Día de renovación
            <input
              name="renewal_day"
              type="number"
              min="1"
              max="31"
              defaultValue="1"
              required
            />

            <small>
              Puede ser del 1 al 31. En meses más cortos se usará
              automáticamente el último día.
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
              defaultChecked
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
              defaultValue="7"
              required
            />
          </label>
        </div>

        <button type="submit">
          Guardar cliente
        </button>
      </form>
    </>
  );
}