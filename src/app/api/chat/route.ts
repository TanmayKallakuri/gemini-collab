import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { groupId, messages, groupName } = await request.json();

  // Verify user is a member of this group
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return new Response("Not a member", { status: 403 });
  }

  const systemPrompt = `You are Gemini, an AI assistant participating in a group chat called "${groupName}".
You're helpful, concise, and conversational. You can see the recent chat history and respond naturally.
When someone mentions @Gemini or asks you a question, respond helpfully.
Keep responses concise — this is a chat, not an essay. Use markdown for code or formatting when helpful.
Be friendly and collaborative.`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: messages.map((m: any) => ({
      role: m.is_ai ? ("assistant" as const) : ("user" as const),
      content: m.is_ai ? m.content : `${m.display_name}: ${m.content}`,
    })),
  });

  return result.toTextStreamResponse();
}
