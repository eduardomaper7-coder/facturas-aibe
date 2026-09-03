"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import { formatEuro } from "@/lib/money";
import { Input, Select } from "@/components/ui/field";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { IconLinkButton, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { DropdownMenu, MenuLinkItem } from "@/components/ui/dropdown-menu";
import { ConfirmSubmitMenuItem } from "@/components/ui/confirm-action";
import { deactivateClient } from "./actions";

export type ClientRow = {
  id: string;
  businessName: string;
  taxId: string;
  email: string | null;
  subscription: {
    id: string;
    serviceName: string;
    baseAmount: number;
    taxType: string;
    taxRate: number;
    applyIrpf: boolean;
    irpfRate: number;
    renewalDay: number;
  } | null;
};

type SortKey = "name" | "base" | "renewal";

const taxTone: Record<string, BadgeTone> = {
  IVA: "info",
  IGIC: "info",
  EXENTO: "neutral",
};

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [taxFilter, setTaxFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const services = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((client) => {
      if (client.subscription) set.add(client.subscription.serviceName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [clients]);

  const taxTypes = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((client) => {
      if (client.subscription) set.add(client.subscription.taxType);
    });
    return Array.from(set).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = clients.filter((client) => {
      const matchesQuery =
        !query ||
        client.businessName.toLowerCase().includes(query) ||
        client.taxId.toLowerCase().includes(query);

      const matchesService =
        serviceFilter === "all" || client.subscription?.serviceName === serviceFilter;

      const matchesTax = taxFilter === "all" || client.subscription?.taxType === taxFilter;

      return matchesQuery && matchesService && matchesTax;
    });

    const sorted = [...rows].sort((a, b) => {
      if (sortKey === "base") {
        return (b.subscription?.baseAmount ?? -1) - (a.subscription?.baseAmount ?? -1);
      }
      if (sortKey === "renewal") {
        return (a.subscription?.renewalDay ?? 99) - (b.subscription?.renewalDay ?? 99);
      }
      return a.businessName.localeCompare(b.businessName, "es", { sensitivity: "base" });
    });

    return sorted;
  }, [clients, search, serviceFilter, taxFilter, sortKey]);

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Todavía no tienes clientes"
        description="Añade tu primer cliente para empezar a generar facturas."
        action={
          <LinkButton href="/dashboard/clientes/nuevo" size="sm">
            <UserPlus className="size-4" />
            Nuevo cliente
          </LinkButton>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente o NIF…"
            className="pl-9"
          />
        </div>

        <Select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          wrapperClassName="w-44"
        >
          <option value="all">Todos los servicios</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </Select>

        <Select
          value={taxFilter}
          onChange={(event) => setTaxFilter(event.target.value)}
          wrapperClassName="w-40"
        >
          <option value="all">Todos los impuestos</option>
          {taxTypes.map((tax) => (
            <option key={tax} value={tax}>
              {tax}
            </option>
          ))}
        </Select>

        <button
          type="button"
          onClick={() =>
            setSortKey((current) =>
              current === "name" ? "base" : current === "base" ? "renewal" : "name"
            )
          }
          className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-white px-3 py-2 text-[13px] font-medium text-ink hover:bg-bg"
          title="Cambiar orden"
        >
          <ArrowUpDown className="size-3.5 text-muted" />
          {sortKey === "name" ? "Nombre" : sortKey === "base" ? "Base ↓" : "Renovación"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Prueba a cambiar la búsqueda o los filtros."
        />
      ) : (
        <TableScroll>
          <Table>
            <THead>
              <tr>
                <Th>Cliente</Th>
                <Th>NIF</Th>
                <Th>Servicio</Th>
                <Th>Base</Th>
                <Th>Impuesto</Th>
                <Th>IRPF</Th>
                <Th>Renovación</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((client) => (
                <Tr key={client.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{client.businessName}</p>
                      <p className="truncate text-[12px] text-muted">
                        {client.email || "Sin correo"}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-muted">{client.taxId}</Td>
                  <Td>{client.subscription?.serviceName ?? <span className="text-muted">—</span>}</Td>
                  <Td>
                    {client.subscription ? (
                      formatEuro(client.subscription.baseAmount)
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    {client.subscription ? (
                      client.subscription.taxType === "EXENTO" ? (
                        <Badge tone="neutral">Sin impuesto</Badge>
                      ) : (
                        <Badge tone={taxTone[client.subscription.taxType] ?? "neutral"}>
                          {client.subscription.taxType} {client.subscription.taxRate}%
                        </Badge>
                      )
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    {client.subscription?.applyIrpf ? (
                      `${client.subscription.irpfRate}%`
                    ) : (
                      <span className="text-muted">No</span>
                    )}
                  </Td>
                  <Td>
                    {client.subscription ? (
                      `Día ${client.subscription.renewalDay}`
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {client.subscription ? (
                        <IconLinkButton
                          href={`/dashboard/clientes/${client.id}/editar`}
                          title="Editar cliente"
                          className="hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </IconLinkButton>
                      ) : (
                        <Badge tone="neutral">Sin suscripción</Badge>
                      )}

                      <DropdownMenu>
                        {(close) => (
                          <>
                            {client.subscription && (
                              <MenuLinkItem
                                icon={Pencil}
                                href={`/dashboard/clientes/${client.id}/editar`}
                              >
                                Editar cliente
                              </MenuLinkItem>
                            )}
                            <ConfirmSubmitMenuItem
                              action={deactivateClient}
                              hiddenFields={{ client_id: client.id }}
                              label="Eliminar cliente"
                              icon={Trash2}
                              confirmTitle="Eliminar cliente"
                              confirmDescription={
                                <>
                                  Se desactivará <strong>{client.businessName}</strong> y su
                                  suscripción. No se generarán más facturas para este cliente.
                                </>
                              }
                              closeMenu={close}
                            />
                          </>
                        )}
                      </DropdownMenu>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      )}
    </div>
  );
}
