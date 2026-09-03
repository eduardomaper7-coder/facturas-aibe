"use client";

import { useEffect, useState } from "react";
import { Field, Input, Select, Checkbox } from "@/components/ui/field";

type TaxFieldsProps = {
    initialTaxType?: string;
    initialTaxRate?: number;
};

/*
 * "Aplicar impuesto" funciona igual que la casilla de retención de IRPF,
 * pero en el sentido contrario: marcada (por defecto) se aplica el
 * IVA/IGIC elegido; desmarcada, la suscripción queda como "EXENTO" al
 * 0% (un tax_type que la base de datos ya admitía). No hace falta ningún
 * cambio de esquema: es el mismo mecanismo de siempre, solo que ahora se
 * controla con una casilla en vez de un desplegable, y las pantallas que
 * muestran la factura (PDF, panel) ocultan la línea de impuesto por
 * completo cuando tax_type es "EXENTO", en vez de enseñar "EXENTO 0%".
 */
export default function TaxFields({
    initialTaxType = "IGIC",
    initialTaxRate,
}: TaxFieldsProps) {
    const normalizedType = initialTaxType.toUpperCase();
    const initialApplyTax = normalizedType !== "EXENTO";
    // Si ya estaba exenta, no hay un "tipo real" previo que recuperar:
    // se ofrece IGIC por defecto para cuando se vuelva a activar el impuesto.
    const initialRealType = normalizedType === "EXENTO" ? "IGIC" : normalizedType;

    function defaultRate(type: string) {
        switch (type) {
            case "IVA":
                return "21";
            case "IGIC":
                return "7";
            default:
                return "0";
        }
    }

    const [applyTax, setApplyTax] = useState(initialApplyTax);
    const [taxType, setTaxType] = useState(initialRealType);

    const [taxRate, setTaxRate] = useState(
        initialApplyTax && initialTaxRate !== undefined
            ? String(initialTaxRate)
            : defaultRate(initialRealType)
    );

    useEffect(() => {
        setApplyTax(initialApplyTax);
        setTaxType(initialRealType);

        if (initialApplyTax && initialTaxRate !== undefined) {
            setTaxRate(String(initialTaxRate));
        } else {
            setTaxRate(defaultRate(initialRealType));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [normalizedType, initialTaxRate]);

    function handleTaxTypeChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedType = event.target.value;

        setTaxType(selectedType);
        setTaxRate(defaultRate(selectedType));
    }

    return (
        <>
            <Field label="Tipo de impuesto">
                <Select value={taxType} onChange={handleTaxTypeChange} disabled={!applyTax}>
                    <option value="IVA">IVA</option>
                    <option value="IGIC">IGIC</option>
                </Select>
            </Field>

            <Field label="Porcentaje de impuesto">
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                    disabled={!applyTax}
                    required
                />
            </Field>

            <Field label="Aplicar impuesto (IVA/IGIC)" inline className="md:col-span-2">
                <Checkbox
                    checked={applyTax}
                    onChange={(event) => setApplyTax(event.target.checked)}
                />
            </Field>

            {/*
             * Campos ocultos que son los que realmente se envían: así,
             * aunque el desplegable y el campo de arriba se deshabiliten
             * visualmente (y por tanto el navegador no los incluiría en el
             * formulario), el valor correcto ("EXENTO" / 0 cuando la
             * casilla está desmarcada) siempre llega al servidor.
             */}
            <input type="hidden" name="tax_type" value={applyTax ? taxType : "EXENTO"} />
            <input type="hidden" name="tax_rate" value={applyTax ? taxRate : "0"} />
        </>
    );
}
