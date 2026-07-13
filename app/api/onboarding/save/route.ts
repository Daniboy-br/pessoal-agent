import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/db/supabase-server";
import { Answers, awakenAgents, buildProfileSummary, getRankedSignals } from "@/lib/nimbo/onboarding";

const saveOnboardingSchema = z.object({
  appUserId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(120).optional(),
  answers: z.record(z.array(z.string())),
});

const pillarKeyByLabel: Record<string, "memory" | "execution" | "knowledge" | "clarity" | "creation"> = {
  Memória: "memory",
  Execução: "execution",
  Conhecimento: "knowledge",
  Clareza: "clarity",
  Criação: "creation",
};

async function upsertAppUser(input: z.infer<typeof saveOnboardingSchema>) {
  const supabase = getSupabaseServerClient();

  if (input.appUserId) {
    const { data, error } = await supabase
      .from("app_users")
      .update({ beta_status: "onboarded", display_name: input.displayName ?? undefined })
      .eq("id", input.appUserId)
      .select("id, email, display_name")
      .single();

    if (error) throw new Error(`Failed to update app user: ${error.message}`);
    return data;
  }

  if (input.email) {
    const { data: existing, error: lookupError } = await supabase
      .from("app_users")
      .select("id, email, display_name")
      .eq("email", input.email)
      .maybeSingle();

    if (lookupError) throw new Error(`Failed to lookup app user: ${lookupError.message}`);
    if (existing) return existing;
  }

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      email: input.email ?? null,
      display_name: input.displayName ?? "Usuário beta Nimbo",
      beta_status: "onboarded",
      locale: "pt-BR",
    })
    .select("id, email, display_name")
    .single();

  if (error) throw new Error(`Failed to create app user: ${error.message}`);
  return data;
}

export async function POST(request: Request) {
  try {
    const body = saveOnboardingSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();
    const answers = body.answers as Answers;
    const rankedSignals = getRankedSignals(answers);
    const profileSummary = buildProfileSummary(answers);
    const awakenedAgents = awakenAgents(answers);
    const appUser = await upsertAppUser(body);

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        app_user_id: appUser.id,
        nickname: body.displayName ?? appUser.display_name ?? null,
        tone_preference: "calmo_pessoal_hibrido",
        onboarding_answers: answers,
        preferences: {
          experience_tone: "hybrid_calm_personal",
          onboarding_kind: "pre_questionnaire",
        },
        current_context: {
          ranked_signals: rankedSignals,
          profile_summary: profileSummary,
        },
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: "app_user_id" });

    if (profileError) throw new Error(`Failed to upsert user profile: ${profileError.message}`);

    const { data: nimboProfile, error: nimboError } = await supabase
      .from("nimbo_profiles")
      .upsert({
        app_user_id: appUser.id,
        name: "Meu Nimbo",
        status: "active",
        agent_limit: 5,
        metadata: {
          onboarding_version: "pre-questionnaire-v0",
          profile_summary: profileSummary,
          ranked_signals: rankedSignals,
        },
        completed_at: new Date().toISOString(),
      }, { onConflict: "app_user_id" })
      .select("id, name, status")
      .single();

    if (nimboError) throw new Error(`Failed to upsert Nimbo profile: ${nimboError.message}`);

    const agentRows = [
      {
        nimbo_profile_id: nimboProfile.id,
        app_user_id: appUser.id,
        slot: 1,
        agent_kind: "guide",
        name: "Guia central",
        description: "Acolhe o usuário, organiza o contexto inicial e conduz o despertar do Nimbo.",
        emergence_reason: "Agente-base do Nimbo, sempre presente.",
        territory: "visão geral do usuário",
        status: "active",
        tone_profile: { style: "calmo, pessoal, direto e cuidadoso" },
        prompt_version: "nimbo-guide-v0",
        metadata: { role: "central_guide", profile_summary: profileSummary },
        activated_at: new Date().toISOString(),
      },
      ...awakenedAgents.map((agent) => ({
        nimbo_profile_id: nimboProfile.id,
        app_user_id: appUser.id,
        slot: agent.slot,
        agent_kind: "specialist",
        name: agent.name,
        description: agent.mission,
        emergence_reason: `Despertado por sinais do pré-questionário: ${agent.focus}`,
        territory: agent.focus,
        status: "suggested",
        tone_profile: { style: agent.tone },
        prompt_version: "nimbo-specialist-v0",
        metadata: {
          generated_by: "motor-despertar-v0",
          first_move: agent.firstMove,
          pillar_emphasis: agent.pillarEmphasis,
        },
      })),
    ];

    const { data: savedAgents, error: agentsError } = await supabase
      .from("nimbo_agents")
      .upsert(agentRows, { onConflict: "nimbo_profile_id,slot" })
      .select("id, slot, agent_kind, name, metadata");

    if (agentsError) throw new Error(`Failed to upsert Nimbo agents: ${agentsError.message}`);

    const pillarRows = savedAgents.flatMap((agent) => {
      const generated = agentRows.find((row) => row.slot === agent.slot);
      const generatedMetadata = generated?.metadata as { pillar_emphasis?: string[] } | undefined;
      const emphasisLabels = Array.isArray(generatedMetadata?.pillar_emphasis)
        ? generatedMetadata.pillar_emphasis
        : [];

      const keys: Array<"memory" | "execution" | "knowledge" | "clarity" | "creation"> = ["memory", "execution", "knowledge", "clarity", "creation"];
      return keys.map((key) => ({
        agent_id: agent.id,
        pillar_key: key,
        emphasis: emphasisLabels.some((label) => pillarKeyByLabel[label] === key) ? "high" : "standard",
        notes: agent.agent_kind === "guide"
          ? "Guia central usa todos os pilares como base equilibrada."
          : "Ênfase inicial derivada do Motor de Despertar v0.",
        metadata: { source: "onboarding-save-v0" },
      }));
    });

    const { error: pillarsError } = await supabase
      .from("agent_pillars")
      .upsert(pillarRows, { onConflict: "agent_id,pillar_key" });

    if (pillarsError) throw new Error(`Failed to upsert agent pillars: ${pillarsError.message}`);

    return NextResponse.json({
      ok: true,
      appUser,
      nimboProfile,
      profileSummary,
      rankedSignals,
      agents: savedAgents,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown onboarding save error",
    }, { status: 400 });
  }
}
