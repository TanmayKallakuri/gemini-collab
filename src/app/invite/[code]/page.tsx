import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/invite/${code}`);

  // Find group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", code)
    .single();

  if (!group) redirect("/");

  // Join the group (ignore if already a member)
  await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  redirect(`/chat/${group.id}`);
}
