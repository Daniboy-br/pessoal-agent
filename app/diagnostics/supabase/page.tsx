import { getSupabaseServerClient } from "@/lib/db/supabase-server";

export const dynamic = "force-dynamic";

type Diagnostics = {
  ok: boolean;
  projectUrl?: string;
  hasServerKey: boolean;
  schemaReady?: boolean;
  sampleRows?: number;
  error?: string;
  message?: string;
};

async function getDiagnostics(): Promise<Diagnostics> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServerKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);

  if (!url || !hasServerKey) {
    return { ok: false, projectUrl: url, hasServerKey, message: "Missing Supabase env vars" };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("nimbo_profiles").select("id").limit(1);

    if (error) {
      return { ok: false, projectUrl: url, hasServerKey, schemaReady: false, error: error.message };
    }

    return { ok: true, projectUrl: url, hasServerKey, schemaReady: true, sampleRows: data?.length ?? 0 };
  } catch (error) {
    return { ok: false, projectUrl: url, hasServerKey, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export default async function SupabaseDiagnosticsPage() {
  const diagnostics = await getDiagnostics();
  return (
    <main className="page">
      <header className="topbar">
        <div className="brand"><span className="mark" aria-hidden="true" /> Nimbo</div>
        <div className="meta">Diagnóstico<br />Supabase</div>
      </header>
      <h1>Supabase <span className="serif">diagnostics</span>.</h1>
      <p className="lead">Esta página valida as variáveis de ambiente e tenta ler uma tabela base do schema.</p>
      <article className="card important">
        <div className="kicker">Resultado</div>
        <pre className="status">{JSON.stringify(diagnostics, null, 2)}</pre>
      </article>
    </main>
  );
}
