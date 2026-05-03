"use client";

import { useMemo, useState } from "react";
import { Check, MessageSquarePlus, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import {
  useDeleteSession,
  useOpenSession,
  useRenameSession,
  useStartSession,
} from "@/hooks/useChat";

export function SessionSidebar() {
  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeSessionId);
  const open = useOpenSession();
  const start = useStartSession();
  const rename = useRenameSession();
  const remove = useDeleteSession();

  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.topicTitle?.toLowerCase().includes(q) ?? false)
    );
  }, [sessions, query]);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card/30">
      <div className="border-b border-border p-3">
        <Button
          size="sm"
          className="w-full"
          onClick={() => start({})}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">
            {sessions.length === 0
              ? "No conversations yet."
              : "No matches."}
          </li>
        )}
        {filtered.map((session) => {
          const isActive = session.id === activeId;
          const isEditing = editingId === session.id;
          return (
            <li key={session.id}>
              <div
                className={cn(
                  "group mx-2 my-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                  isActive
                    ? "bg-card text-foreground ring-1 ring-inset ring-primary/30"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                {isEditing ? (
                  <>
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          rename(session.id, editValue);
                          setEditingId(null);
                        } else if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        rename(session.id, editValue);
                        setEditingId(null);
                      }}
                      aria-label="Save"
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => open(session.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-medium">{session.title}</div>
                      {session.topicTitle && (
                        <div className="truncate text-[11px] text-muted-foreground/80">
                          {session.topicTitle}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditValue(session.title);
                      }}
                      aria-label="Rename"
                      className="opacity-0 transition group-hover:opacity-100 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this conversation?")) remove(session.id);
                      }}
                      aria-label="Delete"
                      className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
