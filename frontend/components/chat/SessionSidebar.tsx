"use client";

import { useMemo, useState } from "react";
import { Check, MessageSquare, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
    <aside className="flex h-full w-72 flex-col border-r border-white/[0.06] bg-card/60">
      <div className="space-y-2.5 p-3">
        <Button variant="outline" className="w-full justify-start" onClick={() => start({})}>
          <Plus className="h-4 w-4 text-primary" />
          New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            aria-label="Search chats"
            className="h-10 bg-transparent pl-9 text-sm"
          />
        </div>
      </div>

      <div className="label-mono px-5 pb-2 pt-3 text-muted-foreground">Recent</div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
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
                  "group flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors",
                  isActive
                    ? "bg-secondary/[0.1] shadow-[inset_0_0_0_1px_hsl(var(--secondary)/0.3)]"
                    : "hover:bg-white/[0.04]"
                )}
              >
                {isEditing ? (
                  <>
                    <Input
                      autoFocus
                      value={editValue}
                      aria-label="Conversation title"
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          rename(session.id, editValue);
                          setEditingId(null);
                        } else if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-9 rounded-lg px-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        rename(session.id, editValue);
                        setEditingId(null);
                      }}
                      aria-label="Save"
                      className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => open(session.id)}
                      className="focus-ring flex min-h-[40px] min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 pl-1 text-left"
                    >
                      <MessageSquare
                        aria-hidden
                        className={cn("h-4 w-4 shrink-0", isActive ? "text-secondary" : "text-muted-foreground")}
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-sm",
                            isActive ? "font-medium text-foreground" : "text-foreground/85"
                          )}
                        >
                          {session.title}
                        </span>
                        {session.topicTitle && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {session.topicTitle}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditValue(session.title);
                      }}
                      aria-label="Rename"
                      className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.06] hover:text-foreground focus-visible:opacity-100"
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
                      className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive-text focus-visible:opacity-100"
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
