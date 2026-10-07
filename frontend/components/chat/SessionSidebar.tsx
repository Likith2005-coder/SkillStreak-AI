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
    <aside className="flex h-full w-72 flex-col border-r-2 border-border bg-background">
      <div className="p-3 pb-1">
        <Button
          variant="secondary"
          className="w-full uppercase"
          onClick={() => start({})}
        >
          <MessageSquarePlus className="h-5 w-5" strokeWidth={2.6} />
          New chat
        </Button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.6} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-11 rounded-2xl border-2 bg-card pl-9 text-sm font-semibold focus-visible:border-secondary-bright focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto pb-3">
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-sm font-bold text-muted-foreground">
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
                  "group mx-3 my-1.5 flex items-center gap-1 rounded-2xl border-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-secondary-bright bg-secondary/10 text-foreground"
                    : "border-transparent text-foreground hover:bg-muted"
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
                      className="h-9 rounded-xl border-2 text-sm font-semibold"
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
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-5 w-5" strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => open(session.id)}
                      className="focus-ring min-w-0 flex-1 rounded-lg py-0.5 text-left"
                    >
                      <div className={cn("truncate text-sm font-extrabold", isActive && "text-secondary")}>{session.title}</div>
                      {session.topicTitle && (
                        <div className="truncate text-xs font-semibold text-muted-foreground">
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
                      className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-card hover:text-foreground focus-visible:opacity-100"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this conversation?")) remove(session.id);
                      }}
                      aria-label="Delete"
                      className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-card hover:text-destructive-text focus-visible:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.6} />
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
