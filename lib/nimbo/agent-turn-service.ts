import { SupabaseClient } from "@supabase/supabase-js";
import { assertData, assertOk } from "@/lib/nimbo/db-utils";
import { callGuideLlm } from "@/lib/nimbo/llm-provider";
import { MemoryService } from "@/lib/nimbo/memory-service";
import { ObservabilityService } from "@/lib/nimbo/observability-service";
import { renderPrompt } from "@/lib/nimbo/prompt-builder";
import { SessionRouter } from "@/lib/nimbo/session-router";

export type RunAgentTurnInput = {
  appUserId: string;
  message: string;
  conversationId?: string;
  agentId?: string;
  source?: string;
};

export class AgentTurnService {
  private readonly memory: MemoryService;
  private readonly observability: ObservabilityService;
  private readonly sessions: SessionRouter;

  constructor(private readonly supabase: SupabaseClient) {
    this.memory = new MemoryService(supabase);
    this.observability = new ObservabilityService(supabase);
    this.sessions = new SessionRouter(supabase);
  }

  async run(input: RunAgentTurnInput) {
    const trace = this.observability.startTrace();
    const db = this.supabase as any;
    let turnId: string | null = null;

    const runtimeSession = await this.sessions.resolve({
      appUserId: input.appUserId,
      conversationId: input.conversationId,
      agentId: input.agentId,
      source: input.source,
    });

    await this.observability.audit({
      appUserId: input.appUserId,
      eventType: "turn_start",
      actorType: "agent",
      details: {
        request_id: trace.requestId,
        session_key: runtimeSession.sessionKey,
        conversation_id: runtimeSession.conversation.id,
        agent_id: runtimeSession.agent.id,
      },
    });

    const inputMessage = assertData<{ id: string; content: string; created_at: string }>(await db
      .from("messages")
      .insert({
        conversation_id: runtimeSession.conversation.id,
        app_user_id: input.appUserId,
        agent_id: null,
        role: "user",
        content: input.message,
        metadata: {
          source: "agent-turn-service-v1",
          request_id: trace.requestId,
          session_key: runtimeSession.sessionKey,
        },
      })
      .select("id, content, created_at")
      .single(), "Failed to persist input message");

    const memories = await this.memory.prefetch({
      appUserId: input.appUserId,
      agentId: runtimeSession.agent.id,
      limit: 8,
    });

    const prompt = renderPrompt({
      agent: runtimeSession.agent,
      userProfile: runtimeSession.userProfile,
      nimboProfile: runtimeSession.nimboProfile,
      memoryContext: this.memory.buildContextBlock(memories),
      memories,
      userMessage: input.message,
      mode: "free",
      capabilities: [],
    });

    const turn = await this.observability.createTurn({
      conversationId: runtimeSession.conversation.id,
      appUserId: input.appUserId,
      nimboProfileId: runtimeSession.nimboProfile.id,
      agentId: runtimeSession.agent.id,
      inputMessageId: inputMessage.id,
      promptVersion: prompt.version,
      promptBlocks: prompt.blocks.map((block) => block.key),
      sessionKey: runtimeSession.sessionKey,
      requestId: trace.requestId,
    });
    turnId = turn.id;

    try {
      const llm = await callGuideLlm({ systemPrompt: prompt.systemPrompt, userMessage: input.message });
      const latencyMs = this.observability.latencyMs(trace);

      const outputMessage = assertData<{ id: string; content: string; created_at: string }>(await db
        .from("messages")
        .insert({
          conversation_id: runtimeSession.conversation.id,
          app_user_id: input.appUserId,
          agent_id: runtimeSession.agent.id,
          role: "assistant",
          content: llm.content,
          metadata: {
            source: "agent-turn-service-v1",
            turn_id: turn.id,
            request_id: trace.requestId,
            session_key: runtimeSession.sessionKey,
            provider: llm.provider,
            model: llm.model,
          },
        })
        .select("id, content, created_at")
        .single(), "Failed to persist output message");

      await this.observability.recordLlmSuccess({
        appUserId: input.appUserId,
        agentId: runtimeSession.agent.id,
        conversationId: runtimeSession.conversation.id,
        turnId: turn.id,
        promptVersion: prompt.version,
        promptBlocks: prompt.safeMetadata.map((block) => block.key),
        requestId: trace.requestId,
        llm,
      });

      await this.observability.completeTurn({
        turnId: turn.id,
        outputMessageId: outputMessage.id,
        llm,
        latencyMs,
      });

      const memorySync = await this.memory.syncTurn({
        appUserId: input.appUserId,
        agentId: runtimeSession.agent.id,
        inputMessageId: inputMessage.id,
        outputMessageId: outputMessage.id,
        userMessage: input.message,
        assistantMessage: outputMessage.content,
        turnId: turn.id,
      });

      assertOk(await db
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", runtimeSession.conversation.id), "Failed to update conversation activity");

      await this.observability.audit({
        appUserId: input.appUserId,
        eventType: "turn_end",
        actorType: "agent",
        details: {
          request_id: trace.requestId,
          session_key: runtimeSession.sessionKey,
          conversation_id: runtimeSession.conversation.id,
          agent_id: runtimeSession.agent.id,
          turn_id: turn.id,
          memory_sync: memorySync,
          latency_ms: latencyMs,
        },
      });

      return {
        ok: true,
        conversationId: runtimeSession.conversation.id,
        turnId: turn.id,
        sessionKey: runtimeSession.sessionKey,
        assistantMessage: outputMessage,
        provider: llm.provider,
        model: llm.model,
        promptVersion: prompt.version,
        promptBlocks: prompt.safeMetadata,
        memorySync,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = this.observability.latencyMs(trace);
      if (turnId) await this.observability.failTurn({ turnId, error, latencyMs });
      await this.observability.audit({
        appUserId: input.appUserId,
        eventType: "turn_error",
        actorType: "agent",
        details: {
          request_id: trace.requestId,
          session_key: runtimeSession.sessionKey,
          turn_id: turnId,
          latency_ms: latencyMs,
          error_message: error instanceof Error ? error.message : "Unknown turn error",
        },
      });
      throw error;
    }
  }
}
