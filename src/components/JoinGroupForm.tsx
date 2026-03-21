"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinGroupForm() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().replace("#", "");
    if (!trimmed) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Find group by invite code
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", trimmed)
      .single();

    if (!group) {
      setError("Group not found");
      setLoading(false);
      return;
    }

    // Join the group (upsert to handle already a member)
    await supabase
      .from("group_members")
      .upsert({ group_id: group.id, user_id: user.id }, { onConflict: "group_id,user_id" });

    setCode("");
    setOpen(false);
    setLoading(false);
    router.push(`/chat/${group.id}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-700 cursor-pointer"
      >
        Join Group
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleJoin}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Join a Group</h3>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Invite code (e.g. a1b2c3d4)"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(""); }}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </form>
    </div>
  );
}
