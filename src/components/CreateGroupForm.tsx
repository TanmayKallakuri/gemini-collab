"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateGroupForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user) {
      setError(`Auth failed: ${authError?.message || "no user"}`);
      setLoading(false);
      return;
    }

    const { data: group, error: insertError } = await supabase
      .from("groups")
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (insertError || !group) {
      setError(`Create failed: ${insertError?.message || "unknown"}`);
      setLoading(false);
      return;
    }

    // Auto-join the creator
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    if (joinError) {
      setError(`Join failed: ${joinError.message}`);
      setLoading(false);
      return;
    }

    setName("");
    setOpen(false);
    setLoading(false);
    router.push(`/chat/${group.id}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        New Group
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleCreate}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Create a Group</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
