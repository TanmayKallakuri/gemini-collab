"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Message, Group } from "@/lib/types";

interface ChatViewProps {
  group: Group;
  currentUserId: string;
  initialMessages: Message[];
  members: any[];
}

export function ChatView({
  group,
  currentUserId,
  initialMessages,
  members,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${group.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch the profile for this message
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", newMsg.user_id)
              .single();
            newMsg.profiles = profile || undefined;
          }
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");

    // Insert the user message
    const { error } = await supabase.from("messages").insert({
      group_id: group.id,
      user_id: currentUserId,
      content: text,
      is_ai: false,
    });

    if (error) {
      console.error("Failed to send message:", error);
      return;
    }

    // Check if @Gemini is mentioned
    if (text.toLowerCase().includes("@gemini")) {
      triggerGemini(text);
    }
  };

  const triggerGemini = async (latestText: string) => {
    setAiLoading(true);

    // Build context: last 20 messages + the new one
    const contextMessages = [
      ...messages.slice(-20).map((m) => ({
        content: m.content,
        display_name: m.is_ai ? "Gemini" : m.profiles?.display_name || "User",
        is_ai: m.is_ai,
      })),
      {
        content: latestText,
        display_name:
          members.find((m: any) => m.user_id === currentUserId)?.profiles
            ?.display_name || "User",
        is_ai: false,
      },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          messages: contextMessages,
          groupName: group.name,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");

      // Read the streamed text response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      // Insert the AI response as a message
      if (fullText.trim()) {
        await supabase.from("messages").insert({
          group_id: group.id,
          user_id: currentUserId, // sent by the user who triggered it
          content: fullText.trim(),
          is_ai: true,
        });
      }
    } catch (err) {
      console.error("Gemini error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const copyInviteCode = () => {
    const link = `${window.location.origin}/invite/${group.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMemberProfile = (userId: string | null) => {
    if (!userId) return null;
    const member = members.find((m: any) => m.user_id === userId);
    return member?.profiles;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-white">{group.name}</h1>
            <p className="text-xs text-gray-500">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteCode}
            className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors font-mono cursor-pointer"
          >
            {copied ? "Copied!" : `#${group.invite_code}`}
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-16">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">
                Say something! Type <span className="text-blue-400 font-mono">@Gemini</span> to get AI in the conversation.
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const profile = msg.profiles || getMemberProfile(msg.user_id);
            const isOwn = msg.user_id === currentUserId && !msg.is_ai;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.is_ai
                      ? "bg-gradient-to-br from-blue-500 to-violet-600"
                      : "bg-gray-700"
                  }`}
                >
                  {msg.is_ai
                    ? "G"
                    : profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      : (profile?.display_name?.[0] || "?").toUpperCase()}
                </div>
                {/* Bubble */}
                <div
                  className={`max-w-[70%] ${
                    isOwn
                      ? "bg-blue-600 rounded-2xl rounded-tr-md"
                      : msg.is_ai
                        ? "bg-gradient-to-br from-blue-900/50 to-violet-900/50 border border-blue-800/50 rounded-2xl rounded-tl-md"
                        : "bg-gray-800 rounded-2xl rounded-tl-md"
                  } px-4 py-2.5`}
                >
                  <p
                    className={`text-xs font-medium mb-1 ${
                      msg.is_ai ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {msg.is_ai ? "Gemini" : profile?.display_name || "User"}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          {aiLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                G
              </div>
              <div className="bg-gradient-to-br from-blue-900/50 to-violet-900/50 border border-blue-800/50 rounded-2xl rounded-tl-md px-4 py-3">
                <p className="text-xs font-medium mb-1 text-blue-400">Gemini</p>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Members sidebar */}
        {showMembers && (
          <div className="w-56 border-l border-gray-800 p-4 overflow-y-auto shrink-0">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Members</h3>
            <div className="space-y-3">
              {/* Gemini as a member */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold">
                  G
                </div>
                <span className="text-sm text-blue-400">Gemini AI</span>
              </div>
              {members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs overflow-hidden">
                    {m.profiles?.avatar_url ? (
                      <img src={m.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      (m.profiles?.display_name?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <span className="text-sm text-gray-300 truncate">
                    {m.profiles?.display_name || "User"}
                    {m.user_id === currentUserId && (
                      <span className="text-gray-500 ml-1">(you)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-800 px-4 py-3 shrink-0"
      >
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message... (@Gemini to ask AI)"
            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 text-sm"
            disabled={aiLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || aiLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
