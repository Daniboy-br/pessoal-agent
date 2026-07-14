import { SupabaseClient } from "@supabase/supabase-js";
import { assertOk, clipText } from "@/lib/nimbo/db-utils";

export type RuntimeMemory = {
  id?: string;
  memory_type: string;
  content: string;
  confidence?: number | null;
  scope?: string | null;
  sensitivity?: string | null;
};

export type PrefetchMemoriesInput = {
  appUserId: string;
  agentId?: string;
  limit?: number;
};

export type SyncTurnInput = {
  appUserId: string;
  agentId: string;
  inputMessageId: string;
  outputMessageId: string;
  userMessage: string;
  assistantMessage: string;
  turnId: string;
};

function classifyMemoryType(text: string): RuntimeMemory["memory_type"] {
  const normalized = text.toLowerCase();
  if (/\b(quero|objetivo|meta|preciso chegar|pretendo)\b/.test(normalized)) return "goal";
  if (/\b(prefiro|gosto|não gosto|nao gosto|melhor pra mim)\b/.test(normalized)) return "preference";
  if (/\b(decidi|decisão|decisao|vamos fazer|fechado)\b/.test(normalized)) return "decision";
  if (/\b(não posso|nao posso|limite|restrição|restricao|evitar)\b/.test(normalized)) return "constraint";
  return "note";
}

function shouldCreateCandidate(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 24) return false;
  if (/^(oi|olá|ola|ok|teste|valeu|obrigado)[!. ]*$/i.test(trimmed)) return false;
  return true;
}

export class MemoryService {
  constructor(private readonly supabase: SupabaseClient) {}

  async prefetch(input: PrefetchMemoriesInput): Promise<RuntimeMemory[]> {
    const db = this.supabase as any;
    const result = await db
      .from("memories")
      .select("id, memory_type, content, confidence, scope, sensitivity")
      .eq("app_user_id", input.appUserId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 8);

    if (result.error) throw new Error(`Failed to prefetch memories: ${result.error.message}`);
    return result.data ?? [];
  }

  buildContextBlock(memories: RuntimeMemory[]) {
    if (!memories.length) return "Nenhuma memória ativa recuperada para este turno.";
    return memories
      .map((memory) => `- [${memory.memory_type}; confiança ${memory.confidence ?? "n/a"}] ${memory.content}`)
      .join("\n");
  }

  async syncTurn(input: SyncTurnInput) {
    if (!shouldCreateCandidate(input.userMessage)) {
      return { created: 0, skippedReason: "message_too_short_or_low_signal" };
    }

    const db = this.supabase as any;
    const memoryType = classifyMemoryType(input.userMessage);
    const content = clipText(
      memoryType === "note"
        ? `Usuário trouxe no turno: ${input.userMessage}`
        : `Possível ${memoryType} do usuário: ${input.userMessage}`,
      700,
    );

    const existing = await db
      .from("memories")
      .select("id")
      .eq("source_message_id", input.inputMessageId)
      .maybeSingle();

    if (existing.error) throw new Error(`Failed to check memory candidate: ${existing.error.message}`);
    if (existing.data) return { created: 0, skippedReason: "candidate_already_exists" };

    assertOk(await db
      .from("memories")
      .insert({
        app_user_id: input.appUserId,
        agent_id: input.agentId,
        scope: "nimbo",
        memory_type: memoryType,
        content,
        confidence: 0.45,
        sensitivity: "normal",
        status: "candidate",
        source_message_id: input.inputMessageId,
        normalized_content: {
          source: "memory-service-v0",
          turn_id: input.turnId,
          output_message_id: input.outputMessageId,
          extraction_mode: "heuristic_candidate",
        },
      }), "Failed to create memory candidate");

    return { created: 1, memoryType };
  }
}
