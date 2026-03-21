import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatView } from "@/components/ChatView";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/");

  // Get group info
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) redirect("/");

  // Get members with profiles
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, display_name, avatar_url)")
    .eq("group_id", id);

  // Get initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(id, display_name, avatar_url)")
    .eq("group_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <ChatView
      group={group}
      currentUserId={user.id}
      initialMessages={messages || []}
      members={members || []}
    />
  );
}
