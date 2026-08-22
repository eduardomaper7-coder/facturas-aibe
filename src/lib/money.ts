export function calculateInvoice(
  subtotal: number,
  taxRate: number,
  applyIrpf: boolean,
  irpfRate: number
) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const taxAmount = round(subtotal * taxRate / 100);
  const irpfAmount = applyIrpf ? round(subtotal * irpfRate / 100) : 0;
  const totalAmount = round(subtotal + taxAmount - irpfAmount);

  return { subtotal: round(subtotal), taxAmount, irpfAmount, totalAmount };
}

export function formatEuro(value: number | string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}
