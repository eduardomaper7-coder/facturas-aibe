"use client";

import { Download, FileText, Mail, Trash2 } from "lucide-react";
import { formatEuro } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { IconLinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmSubmitMenuItem, SubmitMenuItem } from "@/components/ui/confirm-action";
import { deleteInvoice, reenviarFacturaCorreo } from "./actions";

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  subtotal: number;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  irpfAmount: number;
  totalAmount: number;
  emailSentAt: string | null;
  emailError: string | null;
  clientName: string;
  clientEmail: string | null;
  /** Solo la última factura emitida (número correlativo más alto) se puede borrar. */
  isLastIssued: boolean;
};

export function InvoicesTable({ invoices, month }: { invoices: InvoiceRow[]; month: string }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay facturas para este mes"
        description="Genera las facturas del periodo desde el botón de arriba."
      />
    );
  }

  return (
    <TableScroll>
      <Table>
        <THead>
          <tr>
            <Th>Factura</Th>
            <Th>Emisión</Th>
            <Th>Cliente</Th>
            <Th>Base</Th>
            <Th>Impuestos</Th>
            <Th>IRPF</Th>
            <Th>Total</Th>
            <Th>PDF</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </THead>
        <TBody>
          {invoices.map((invoice) => {
            const status = getInvoiceStatus(invoice);

            return (
              <Tr key={invoice.id}>
                <Td>
                  <span className="font-semibold text-ink">{invoice.invoiceNumber}</span>
                </Td>
                <Td className="text-muted">{invoice.issueDate}</Td>
                <Td>{invoice.clientName}</Td>
                <Td>{formatEuro(invoice.subtotal)}</Td>
                <Td className="text-muted">
                  {invoice.taxType === "EXENTO"
                    ? "Sin impuesto"
                    : `${invoice.taxType} ${invoice.taxRate}% · ${formatEuro(invoice.taxAmount)}`}
                </Td>
                <Td className="text-muted">
                  {Number(invoice.irpfAmount) > 0 ? `− ${formatEuro(invoice.irpfAmount)}` : "—"}
                </Td>
                <Td>
                  <span className="font-semibold text-ink">{formatEuro(invoice.totalAmount)}</span>
                </Td>
                <Td>
                  <IconLinkButton
                    href={`/api/invoices/${invoice.id}/pdf`}
                    title="Descargar PDF"
                    className="hover:text-primary"
                  >
                    <Download className="size-4" />
                  </IconLinkButton>
                </Td>
                <Td>
                  <Tooltip label={status.detail}>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Tooltip>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    {(invoice.clientEmail || invoice.isLastIssued) && (
                      <DropdownMenu>
                        {(close) => (
                          <>
                            {invoice.clientEmail && (
                              <SubmitMenuItem
                                action={reenviarFacturaCorreo}
                                hiddenFields={{ invoice_id: invoice.id }}
                                label={invoice.emailError ? "Reintentar envío" : "Reenviar por correo"}
                                icon={Mail}
                                closeMenu={close}
                              />
                            )}
                            {invoice.isLastIssued && (
                              <ConfirmSubmitMenuItem
                                action={deleteInvoice}
                                hiddenFields={{ invoice_id: invoice.id, month }}
                                label="Borrar factura"
                                icon={Trash2}
                                confirmTitle="Borrar factura"
                                confirmDescription={
                                  <>
                                    Se borrará la factura <strong>{invoice.invoiceNumber}</strong> y
                                    quedará libre su número: la próxima factura que emitas lo
                                    reutilizará. Solo puede borrarse porque es la última emitida.
                                  </>
                                }
                                closeMenu={close}
                              />
                            )}
                          </>
                        )}
                      </DropdownMenu>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </TableScroll>
  );
}

function getInvoiceStatus(invoice: InvoiceRow) {
  if (invoice.emailSentAt) {
    return {
      tone: "success" as const,
      label: "Enviada",
      detail: "Factura enviada correctamente por correo.",
    };
  }

  if (!invoice.clientEmail) {
    return {
      tone: "warning" as const,
      label: "Pendiente",
      detail: "El cliente no tiene correo: envíasela manualmente, por ejemplo por WhatsApp.",
    };
  }

  if (invoice.emailError) {
    return {
      tone: "danger" as const,
      label: "Error",
      detail: `Error al enviar: ${invoice.emailError}`,
    };
  }

  return {
    tone: "warning" as const,
    label: "Pendiente",
    detail: "Todavía no se ha enviado por correo.",
  };
}
