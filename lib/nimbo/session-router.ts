import { SupabaseClient } from "@supabase/supabase-js";
import { assertData } from "@/lib/nimbo/db-utils";

export type UserProfile = {
  id: string;
  nickname?: string | null;
  tone_preference?: string | null;
  current_context?: Record<string, unknown> | null;
};

export type NimboProfile = {
  id: string;
  name?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NimboAgent = {
  id: string;
  name: string;
  agent_kind: "guide" | "specialist";
  description?: string | null;
  territory?: string | null;
  tone_profile?: Record<string, unknown> | null;
  prompt_version?: string | null;
};

export type Conversation = {
  id: string;
  title?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
};

export type RuntimeSession = {
  appUserId: string;
  sessionKey: string;
  userProfile: UserProfile;
  nimboProfile: NimboProfile;
  agent: NimboAgent;
  conversation: Conversation;
};

export type ResolveSessionInput = {
  appUserId: string;
  conversationId?: string;
  agentId?: string;
  source?: string;
};

function buildSessionKey(input: { appUserId: string; nimboProfileId: string; agentId: string; source?: string }) {
  return ["nimbo", input.source ?? "app", input.appUserId, input.nimboProfileId, input.agentId].join(":");
}

export class SessionRouter {
  constructor(private readonly supabase: SupabaseClient) {}

  async resolve(input: ResolveSessionInput): Promise<RuntimeSession> {
    const db = this.supabase as any;

    const userProfile = assertData<UserProfile>(await db
      .from("user_profiles")
      .select("id, nickname, tone_preference, current_context")
      .eq("app_user_id", input.appUserId)
      .maybeSingle(), "Failed to load user profile");

    const nimboProfile = assertData<NimboProfile>(await db
      .from("nimbo_profiles")
      .select("id, name, status, metadata")
      .eq("app_user_id", input.appUserId)
      .single(), "Failed to load Nimbo profile");

    const agentQuery = db
      .from("nimbo_agents")
      .select("id, name, agent_kind, description, territory, tone_profile, prompt_version")
      .eq("app_user_id", input.appUserId);

    const agent = assertData<NimboAgent>(input.agentId
      ? await agentQuery.eq("id", input.agentId).single()
      : await agentQuery.eq("agent_kind", "guide").order("slot", { ascending: true }).limit(1).single(),
      "Failed to load Nimbo agent");

    const sessionKey = buildSessionKey({
      appUserId: input.appUserId,
      nimboProfileId: nimboProfile.id,
      agentId: agent.id,
      source: input.source,
    });

    const conversation = input.conversationId
      ? assertData<Conversation>(await db
        .from("conversations")
        .select("id, title, status, metadata")
        .eq("id", input.conversationId)
        .eq("app_user_id", input.appUserId)
        .single(), "Failed to load conversation")
      : assertData<Conversation>(await db
        .from("conversations")
        .insert({
          app_user_id: input.appUserId,
          nimbo_profile_id: nimboProfile.id,
          agent_id: agent.id,
          title: agent.agent_kind === "guide" ? "Conversa com o guia central" : `Conversa com ${agent.name}`,
          mode: "free",
          status: "open",
          metadata: {
            source: "session-router-v0",
            session_key: sessionKey,
            source_channel: input.source ?? "app",
          },
          last_message_at: new Date().toISOString(),
        })
        .select("id, title, status, metadata")
        .single(), "Failed to create conversation");

    return {
      appUserId: input.appUserId,
      sessionKey,
      userProfile,
      nimboProfile,
      agent,
      conversation,
    };
  }
}
