import { randomUUID } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { assertData, assertOk } from "@/lib/nimbo/db-utils";
import { LlmResponse } from "@/lib/nimbo/llm-provider";

export type RuntimeTrace = {
  requestId: string;
  startedAt: number;
};

export type CreateTurnInput = {
  conversationId: string;
  appUserId: string;
  nimboProfileId: string;
  agentId: string;
  inputMessageId: string;
  promptVersion: string;
  promptBlocks: string[];
  sessionKey: string;
  requestId: string;
};

export class ObservabilityService {
  constructor(private readonly supabase: SupabaseClient) {}

  startTrace(): RuntimeTrace {
    return { requestId: randomUUID(), startedAt: Date.now() };
  }

  latencyMs(trace: RuntimeTrace) {
    return Date.now() - trace.startedAt;
  }

  async audit(input: {
    appUserId?: string;
    eventType: string;
    actorType?: "system" | "user" | "admin" | "agent";
    details?: Record<string, unknown>;
  }) {
    const db = this.supabase as any;
    const result = await db.from("audit_events").insert({
      app_user_id: input.appUserId ?? null,
      event_type: input.eventType,
      actor_type: input.actorType ?? "system",
      details: {
        redaction: "metadata_only",
        ...input.details,
      },
    });

    if (result.error) throw new Error(`Failed to record audit event: ${result.error.message}`);
  }

  async createTurn(input: CreateTurnInput) {
    const db = this.supabase as any;
    return assertData<{ id: string }>(await db
      .from("agent_turns")
      .insert({
        conversation_id: input.conversationId,
        app_user_id: input.appUserId,
        nimbo_profile_id: input.nimboProfileId,
        agent_id: input.agentId,
        input_message_id: input.inputMessageId,
        status: "running",
        prompt_version: input.promptVersion,
        metadata: {
          prompt_blocks: input.promptBlocks,
          source: "observability-service-v0",
          session_key: input.sessionKey,
          request_id: input.requestId,
          event_model: "openclaw_metadata_only_v0",
        },
      })
      .select("id")
      .single(), "Failed to create agent turn");
  }

  async recordLlmSuccess(input: {
    appUserId: string;
    agentId: string;
    conversationId: string;
    turnId: string;
    promptVersion: string;
    promptBlocks: string[];
    requestId: string;
    llm: LlmResponse;
  }) {
    const db = this.supabase as any;
    assertOk(await db
      .from("llm_calls")
      .insert({
        app_user_id: input.appUserId,
        agent_id: input.agentId,
        conversation_id: input.conversationId,
        provider: input.llm.provider,
        model: input.llm.model,
        prompt_version: input.promptVersion,
        input_tokens: input.llm.inputTokens ?? null,
        output_tokens: input.llm.outputTokens ?? null,
        total_cost_usd: input.llm.estimatedCostUsd ?? null,
        status: "success",
        metadata: {
          turn_id: input.turnId,
          request_id: input.requestId,
          prompt_blocks: input.promptBlocks,
          raw: input.llm.raw ?? null,
        },
      }), "Failed to persist LLM call");
  }

  async completeTurn(input: {
    turnId: string;
    outputMessageId: string;
    llm: LlmResponse;
    latencyMs: number;
    exitReason?: string;
  }) {
    const db = this.supabase as any;
    assertOk(await db
      .from("agent_turns")
      .update({
        output_message_id: input.outputMessageId,
        status: "completed",
        provider: input.llm.provider,
        model: input.llm.model,
        input_tokens: input.llm.inputTokens ?? null,
        output_tokens: input.llm.outputTokens ?? null,
        estimated_cost_usd: input.llm.estimatedCostUsd ?? null,
        latency_ms: input.latencyMs,
        api_call_count: 1,
        exit_reason: input.exitReason ?? "assistant_response",
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.turnId), "Failed to complete agent turn");
  }

  async failTurn(input: { turnId: string; error: unknown; latencyMs: number }) {
    const db = this.supabase as any;
    assertOk(await db
      .from("agent_turns")
      .update({
        status: "error",
        latency_ms: input.latencyMs,
        error_message: input.error instanceof Error ? input.error.message : "Unknown turn error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.turnId), "Failed to mark agent turn as error");
  }
}
