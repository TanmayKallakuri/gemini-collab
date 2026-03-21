import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { LogoutButton } from "@/components/LogoutButton";
import { JoinGroupForm } from "@/components/JoinGroupForm";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, invite_code, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const groups =
    memberships?.map((m: any) => m.groups).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Gemini Collab" className="w-9 h-9 rounded-xl" />
          <h1 className="text-lg font-semibold text-white">Gemini Collab</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {profile?.display_name}
          </span>
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Groups</h2>
          <div className="flex gap-2">
            <JoinGroupForm />
            <CreateGroupForm />
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No groups yet</p>
            <p className="text-sm">
              Create a group or join one with an invite code
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group: any) => (
              <Link
                key={group.id}
                href={`/chat/${group.id}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{group.name}</h3>
                  <span className="text-xs text-gray-500 font-mono">
                    #{group.invite_code}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
