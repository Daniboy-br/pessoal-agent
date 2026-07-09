import Link from "next/link";
import { agentPillars, initialAgents } from "@/lib/nimbo/constants";

export default function Home() {
  return (
    <main className="page">
      <header className="topbar">
        <div className="brand"><span className="mark" aria-hidden="true" /> Nimbo</div>
        <div className="meta">POC app<br />5 agentes</div>
      </header>

      <section>
        <h1>Find your <span className="serif">center</span>. Find your <span className="serif">Nimbo</span>.</h1>
        <p className="lead">
          Nimbo é um campo pessoal com cinco agentes. O guia central entende o contexto geral e os especialistas emergentes entram em cena conforme a vida do usuário revela necessidades reais.
        </p>
        <p><Link className="cta" href="/diagnostics/supabase">Ver diagnóstico Supabase</Link></p>
      </section>

      <section className="grid two" aria-label="Agentes iniciais">
        {initialAgents.map((agent) => (
          <article className="card important" key={agent.slot}>
            <div className="kicker">Agente {agent.slot} · {agent.role === "guide" ? "guia" : "especialista"}</div>
            <h2>{agent.name}</h2>
            <p>{agent.description}</p>
          </article>
        ))}
      </section>

      <section>
        <h2>Pilares internos de todo agente</h2>
        <p className="lead">Esses pilares não são personagens principais. São capacidades internas que todo agente do Nimbo precisa carregar.</p>
        <div className="grid five">
          {agentPillars.map((pillar) => (
            <article className="card" key={pillar.key}>
              <div className="kicker">{pillar.key}</div>
              <h3>{pillar.label}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
