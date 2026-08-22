"use client";

import { useEffect, useState } from "react";

type TaxFieldsProps = {
    initialTaxType?: string;
    initialTaxRate?: number;
};

export default function TaxFields({
    initialTaxType = "IGIC",
    initialTaxRate,
}: TaxFieldsProps) {
    const normalizedType = initialTaxType.toUpperCase();

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

    const [taxType, setTaxType] = useState(normalizedType);

    const [taxRate, setTaxRate] = useState(
        initialTaxRate !== undefined
            ? String(initialTaxRate)
            : defaultRate(normalizedType)
    );

    useEffect(() => {
        setTaxType(normalizedType);

        if (initialTaxRate !== undefined) {
            setTaxRate(String(initialTaxRate));
        } else {
            setTaxRate(defaultRate(normalizedType));
        }
    }, [normalizedType, initialTaxRate]);

    function handleTaxTypeChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedType = event.target.value;

        setTaxType(selectedType);

        switch (selectedType) {
            case "IVA":
                setTaxRate("21");
                break;

            case "IGIC":
                setTaxRate("7");
                break;

            default:
                setTaxRate("0");
                break;
        }
    }

    return (
        <>
            <label>
                Tipo de impuesto

                <select
                    name="tax_type"
                    value={taxType}
                    onChange={handleTaxTypeChange}
                >
                    <option value="IVA">IVA</option>
                    <option value="IGIC">IGIC</option>
                    <option value="EXENTO">Exento</option>
                </select>
            </label>

            <label>
                Porcentaje de impuesto

                <input
                    name="tax_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(event) =>
                        setTaxRate(event.target.value)
                    }
                    required
                />
            </label>
        </>
    );
}