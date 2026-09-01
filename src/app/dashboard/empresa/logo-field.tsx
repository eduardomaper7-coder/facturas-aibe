"use client";

import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

/**
 * Mantiene exactamente el mismo campo de formulario (name="logo_url") que
 * ya guarda src/app/dashboard/empresa/actions.ts: solo cambia cómo se
 * presenta. En modo vista se ve la preview del logo; al pulsar "Cambiar
 * logo" aparece el campo de URL para editarlo.
 */
export function LogoField({ initialUrl }: { initialUrl: string }) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(initialUrl);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg">
        {preview ? (
          // Puede ser cualquier URL pública, por eso no se usa next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo de la empresa" className="size-full object-contain p-2" />
        ) : (
          <Building2 className="size-6 text-muted-soft" />
        )}
      </span>

      <div className="min-w-[220px] flex-1">
        {editing ? (
          <Input
            name="logo_url"
            type="url"
            autoFocus
            placeholder="https://…"
            defaultValue={initialUrl}
            onChange={(event) => setPreview(event.target.value)}
          />
        ) : (
          <>
            <input type="hidden" name="logo_url" value={initialUrl} />
            <p className="text-[13px] text-muted">
              {initialUrl ? "Logo configurado." : "Todavía no has subido un logo."}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
          Cambiar logo
        </Button>
      )}
    </div>
  );
}
