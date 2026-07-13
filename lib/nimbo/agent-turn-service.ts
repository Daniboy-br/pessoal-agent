import { SupabaseClient } from "@supabase/supabase-js";
import { callGuideLlm } from "@/lib/nimbo/llm-provider";
import { renderPrompt } from "@/lib/nimbo/prompt-builder";

export type RunAgentTurnInput = {
  appUserId: string;
  message: string;
  conversationId?: string;
  agentId?: string;
};

function assertData(result: { data: unknown; error: { message: string } | null }, message: string): any {
  if (result.error) throw new Error(`${message}: ${result.error.message}`);
  if (!result.data) throw new Error(`${message}: empty result`);
  return result.data;
}

export class AgentTurnService {
  constructor(private readonly supabase: SupabaseClient) {}

  async run(input: RunAgentTurnInput) {
    const startedAt = Date.now();
    const appUserId = input.appUserId;
    const db = this.supabase as any;

    const userProfile = assertData(await db
      .from("user_profiles")
      .select("id, nickname, tone_preference, current_context")
      .eq("app_user_id", appUserId)
      .maybeSingle(), "Failed to load user profile");

    const nimboProfile = assertData(await db
      .from("nimbo_profiles")
      .select("id, name, status, metadata")
      .eq("app_user_id", appUserId)
      .single(), "Failed to load Nimbo profile");

    const agent = assertData(await db
      .from("nimbo_agents")
      .select("id, name, agent_kind, description, territory, tone_profile, prompt_version")
      .eq("app_user_id", appUserId)
      .eq("agent_kind", "guide")
      .order("slot", { ascending: true })
      .limit(1)
      .single(), "Failed to load guide agent");

    const conversation = input.conversationId
      ? assertData(await db
        .from("conversations")
        .select("id, title, status")
        .eq("id", input.conversationId)
        .eq("app_user_id", appUserId)
        .single(), "Failed to load conversation")
      : assertData(await db
        .from("conversations")
        .insert({
          app_user_id: appUserId,
          nimbo_profile_id: nimboProfile.id,
          agent_id: agent.id,
          title: "Conversa com o guia central",
          mode: "free",
          status: "open",
          metadata: { source: "agent-turn-service-v0" },
          last_message_at: new Date().toISOString(),
        })
        .select("id, title, status")
        .single(), "Failed to create conversation");

    const inputMessage = assertData(await db
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        app_user_id: appUserId,
        agent_id: null,
        role: "user",
        content: input.message,
        metadata: { source: "agent-turn-service-v0" },
      })
      .select("id, content, created_at")
      .single(), "Failed to persist input message");

    const memoriesResult = await db
      .from("memories")
      .select("memory_type, content, confidence")
      .eq("app_user_id", appUserId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (memoriesResult.error) throw new Error(`Failed to prefetch memories: ${memoriesResult.error.message}`);

    const prompt = renderPrompt({
      agent,
      userProfile,
      nimboProfile,
      memories: memoriesResult.data ?? [],
      userMessage: input.message,
    });

    const turn = assertData(await db
      .from("agent_turns")
      .insert({
        conversation_id: conversation.id,
        app_user_id: appUserId,
        nimbo_profile_id: nimboProfile.id,
        agent_id: agent.id,
        input_message_id: inputMessage.id,
        status: "running",
        prompt_version: prompt.version,
        metadata: {
          prompt_blocks: prompt.blocks.map((block) => block.key),
          source: "agent-turn-service-v0",
        },
      })
      .select("id")
      .single(), "Failed to create agent turn");

    try {
      const llm = await callGuideLlm({ systemPrompt: prompt.systemPrompt, userMessage: input.message });
      const latencyMs = Date.now() - startedAt;

      const outputMessage = assertData(await db
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          app_user_id: appUserId,
          agent_id: agent.id,
          role: "assistant",
          content: llm.content,
          metadata: {
            source: "agent-turn-service-v0",
            turn_id: turn.id,
            provider: llm.provider,
            model: llm.model,
          },
        })
        .select("id, content, created_at")
        .single(), "Failed to persist output message");

      const llmCallResult = await db
        .from("llm_calls")
        .insert({
          app_user_id: appUserId,
          agent_id: agent.id,
          conversation_id: conversation.id,
          provider: llm.provider,
          model: llm.model,
          prompt_version: prompt.version,
          input_tokens: llm.inputTokens ?? null,
          output_tokens: llm.outputTokens ?? null,
          total_cost_usd: llm.estimatedCostUsd ?? null,
          status: "success",
          metadata: {
            turn_id: turn.id,
            prompt_blocks: prompt.blocks.map((block) => block.key),
            raw: llm.raw ?? null,
          },
        });

      if (llmCallResult.error) throw new Error(`Failed to persist LLM call: ${llmCallResult.error.message}`);

      const updateTurnResult = await db
        .from("agent_turns")
        .update({
          output_message_id: outputMessage.id,
          status: "completed",
          provider: llm.provider,
          model: llm.model,
          input_tokens: llm.inputTokens ?? null,
          output_tokens: llm.outputTokens ?? null,
          estimated_cost_usd: llm.estimatedCostUsd ?? null,
          latency_ms: latencyMs,
          api_call_count: 1,
          exit_reason: "assistant_response",
          completed_at: new Date().toISOString(),
        })
        .eq("id", turn.id);

      if (updateTurnResult.error) throw new Error(`Failed to complete agent turn: ${updateTurnResult.error.message}`);

      await db
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);

      return {
        ok: true,
        conversationId: conversation.id,
        turnId: turn.id,
        assistantMessage: outputMessage,
        provider: llm.provider,
        model: llm.model,
        promptVersion: prompt.version,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      await db
        .from("agent_turns")
        .update({
          status: "error",
          latency_ms: latencyMs,
          error_message: error instanceof Error ? error.message : "Unknown turn error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", turn.id);

      throw error;
    }
  }
}
