import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={{ maxWidth: 440, margin: "80px auto", padding: 20 }}>
      <div className="card">
        <h1>Facturas AIBE</h1>
        <p>Acceso al panel privado</p>
        {params.error && <p style={{ color: "crimson" }}>{params.error}</p>}
        <form action={login} className="grid">
          <label>
            Correo
            <input name="email" type="email" required />
          </label>
          <label>
            Contraseña
            <input name="password" type="password" required />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </div>
    </main>
  );
}
