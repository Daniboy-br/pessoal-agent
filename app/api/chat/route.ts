import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/db/supabase-server";
import { AgentTurnService } from "@/lib/nimbo/agent-turn-service";

const chatSchema = z.object({
  appUserId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  source: z.string().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = chatSchema.parse(await request.json());
    const service = new AgentTurnService(getSupabaseServerClient());
    const result = await service.run(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown chat error",
    }, { status: 400 });
  }
}
