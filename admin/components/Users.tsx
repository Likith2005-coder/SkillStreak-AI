"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, type AdminUser } from "@/lib/api";
import { Badge, Button, Card, Input } from "./ui";

export function Users({ meId }: { meId: string | null }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => api.listUsers().then((r) => setUsers(r.users)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = users ?? [];
    if (!q) return list;
    return list.filter((u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
  }, [users, search]);

  async function toggleAdmin(u: AdminUser) {
    const next = u.role === "admin" ? "user" : "admin";
    if (next === "user" && !confirm(`Revoke admin access from ${u.email}?`)) return;
    setBusy(u.id);
    try {
      await api.updateUser(u.id, { role: next });
      toast.success(next === "admin" ? `${u.name} is now an admin` : `Admin revoked from ${u.name}`);
      load();
    } catch (e) {
      toast.error("Couldn't change role", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  async function resetProgress(u: AdminUser) {
    if (!confirm(`Reset ALL learning progress for ${u.email}? This can't be undone.`)) return;
    setBusy(u.id);
    try {
      await api.resetProgress(u.id);
      toast.success(`Progress reset for ${u.name}`);
      load();
    } catch (e) {
      toast.error("Reset failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(u: AdminUser) {
    if (!confirm(`Permanently delete ${u.email} and all their data? This can't be undone.`)) return;
    setBusy(u.id);
    try {
      await api.deleteUser(u.id);
      toast.success(`Deleted ${u.email}`);
      load();
    } catch (e) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!users)
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading users…</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length === 1 ? "" : "s"}</p>

      <div className="space-y-2">
        {filtered.map((u) => {
          const isSelf = u.id === meId;
          return (
            <Card key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u.name}</span>
                    {u.role === "admin" ? <Badge tone="cyan">admin</Badge> : <Badge>user</Badge>}
                    {isSelf && <Badge tone="violet">you</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    Lvl {u.level} · {u.xp} XP · {u.topicsCompleted} topics · streak {u.currentStreak} (best {u.longestStreak})
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Button size="sm" variant="ghost" loading={busy === u.id} onClick={() => toggleAdmin(u)} disabled={isSelf}
                    title={isSelf ? "You can't change your own role" : u.role === "admin" ? "Revoke admin" : "Make admin"}>
                    {u.role === "admin" ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resetProgress(u)} title="Reset progress"><RotateCcw className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(u)} disabled={isSelf} className="text-destructive hover:text-destructive" title="Delete user"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
