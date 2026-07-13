"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { agentPillars } from "@/lib/nimbo/constants";
import { Answers, awakenAgents, buildProfileSummary, completionPercentage, onboardingQuestions } from "@/lib/nimbo/onboarding";

function toggleAnswer(answers: Answers, questionId: string, optionId: string, type: "single" | "multi"): Answers {
  if (type === "single") return { ...answers, [questionId]: [optionId] };

  const current = answers[questionId] ?? [];
  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];

  return { ...answers, [questionId]: next };
}

export default function Home() {
  const [answers, setAnswers] = useState<Answers>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAppUserId, setSavedAppUserId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const awakenedAgents = useMemo(() => awakenAgents(answers), [answers]);
  const profileSummary = useMemo(() => buildProfileSummary(answers), [answers]);
  const progress = completionPercentage(answers);
  const answeredCount = onboardingQuestions.filter((question) => (answers[question.id] ?? []).length > 0).length;
  const canSave = answeredCount === onboardingQuestions.length && saveState !== "saving";

  async function saveOnboarding() {
    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appUserId: savedAppUserId ?? window.localStorage.getItem("nimbo_app_user_id") ?? undefined,
          answers,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? "Não foi possível salvar o onboarding");
      window.localStorage.setItem("nimbo_app_user_id", json.appUser.id);
      setSavedAppUserId(json.appUser.id);
      setSaveState("saved");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Erro inesperado ao salvar onboarding");
      setSaveState("error");
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand"><span className="mark" aria-hidden="true" /> Nimbo</div>
        <div className="meta">V0 navegável<br />pré-questionário</div>
      </header>

      <section className="hero">
        <div className="kicker">Nimbo pessoal</div>
        <h1>Um campo calmo para despertar apoio sob medida.</h1>
        <p className="lead">
          O Nimbo começa com um guia central e um pré-questionário objetivo. A partir dos sinais do perfil, ele sugere especialistas vivos, criados pelo contexto, não escolhidos de uma prateleira fixa.
        </p>
        <div className="heroActions">
          <a className="cta" href="#questionario">Começar pré-questionário</a>
          <Link className="ghost" href="/diagnostics/supabase">Diagnóstico Supabase</Link>
        </div>
      </section>

      <section className="grid two" aria-label="Conceito do Nimbo">
        <article className="card important">
          <div className="kicker">Agente 1 · guia central</div>
          <h2>Guia central</h2>
          <p>Recebe o usuário, faz perguntas simples, organiza sinais e conduz o despertar dos primeiros especialistas do Nimbo.</p>
        </article>
        <article className="card important soft">
          <div className="kicker">Agentes 2-5 · slots vivos</div>
          <h2>Especialistas despertados</h2>
          <p>Quatro espaços iniciais para agentes autocriados conforme contexto, objetivos, rotina, atritos e linguagem do usuário.</p>
        </article>
      </section>

      <section id="questionario" className="questionnaire">
        <div className="sectionHeader">
          <div>
            <div className="kicker">Pré-questionário</div>
            <h2>10 perguntas tangíveis para formar o primeiro Nimbo</h2>
          </div>
          <div className="progressCard" aria-label="Progresso do questionário">
            <strong>{progress}%</strong>
            <span>{answeredCount}/{onboardingQuestions.length} respondidas</span>
          </div>
        </div>

        <div className="questions">
          {onboardingQuestions.map((question, index) => {
            const selected = answers[question.id] ?? [];
            return (
              <article className="questionCard" key={question.id}>
                <div className="questionNumber">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <div className="kicker">{question.eyebrow}</div>
                  <h3>{question.title}</h3>
                  <p>{question.helper}</p>
                  <div className="options" role="group" aria-label={question.title}>
                    {question.options.map((option) => {
                      const active = selected.includes(option.id);
                      return (
                        <button
                          className={active ? "option active" : "option"}
                          key={option.id}
                          type="button"
                          onClick={() => setAnswers((current) => toggleAnswer(current, question.id, option.id, question.type))}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="nimboPreview" aria-label="Prévia do Meu Nimbo">
        <div className="sectionHeader">
          <div>
            <div className="kicker">Meu Nimbo · prévia viva</div>
            <h2>Especialistas sugeridos pelo contexto</h2>
          </div>
          <button className="ghost button" type="button" onClick={() => setAnswers({})}>Limpar respostas</button>
        </div>
        <p className="lead small">
          Estes nomes e missões são gerados por combinação de sinais. Na próxima camada, a IA pode aprofundar tom, memória, limites e primeira conversa.
        </p>
        <div className="savePanel">
          <p><strong>Leitura inicial:</strong> {profileSummary}</p>
          <button className="cta button" type="button" disabled={!canSave} onClick={saveOnboarding}>
            {saveState === "saving" ? "Criando Meu Nimbo..." : saveState === "saved" ? "Meu Nimbo foi salvo" : "Criar Meu Nimbo"}
          </button>
          {answeredCount < onboardingQuestions.length && <span>Responda as 10 perguntas para salvar o primeiro Nimbo.</span>}
          {saveState === "saved" && <span>Perfil, guia central, especialistas e pilares foram persistidos no Supabase.</span>}
          {saveError && <span className="errorText">{saveError}</span>}
        </div>
        <div className="grid four">
          {answeredCount === 0
            ? [2, 3, 4, 5].map((slot) => (
              <article className="agentCard dormant" key={slot}>
                <div className="agentSlot">Agente {slot}</div>
                <h3>Aguardando sinais</h3>
                <p>Este slot ainda não tem identidade. Ele será despertado conforme o pré-questionário revelar contexto suficiente.</p>
              </article>
            ))
            : awakenedAgents.map((agent) => (
              <article className="agentCard" key={agent.slot}>
                <div className="agentSlot">Agente {agent.slot}</div>
                <h3>{agent.name}</h3>
                <p><strong>Missão:</strong> {agent.mission}</p>
                <p><strong>Foco:</strong> {agent.focus}</p>
                <p><strong>Tom:</strong> {agent.tone}</p>
                <p><strong>Primeiro movimento:</strong> {agent.firstMove}</p>
                <div className="chips">
                  {agent.pillarEmphasis.map((pillar) => <span key={pillar}>{pillar}</span>)}
                </div>
              </article>
            ))}
        </div>
      </section>

      <section>
        <h2>Pilares internos de todo agente</h2>
        <p className="lead small">Eles não são personagens fixos. São capacidades internas usadas em diferentes intensidades por cada especialista despertado.</p>
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
