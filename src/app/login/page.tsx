import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { login } from "./actions";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <Image src="/aibe-logo.png" alt="Aibe Technologies" width={168} height={66} priority className="h-11 w-auto" />
        </div>

        <Card className="shadow-md">
          <CardBody>
            <h1 className="text-[18px] font-semibold text-ink">Acceso al panel</h1>
            <p className="mt-1 text-[13px] text-muted">Panel privado de facturación</p>

            {params.error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{params.error}</span>
              </div>
            )}

            <form action={login} className="mt-5 space-y-4">
              <Field label="Correo">
                <Input name="email" type="email" required />
              </Field>
              <Field label="Contraseña">
                <Input name="password" type="password" required />
              </Field>
              <SubmitButton className="w-full" pendingText="Entrando…">
                Entrar
              </SubmitButton>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
