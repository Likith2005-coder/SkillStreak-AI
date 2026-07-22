"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Search, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, type AdminUser } from "@/lib/api";
import { Badge, Button, Card, Input } from "./ui";

export function Access({ meId }: { meId: string | null }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => api.listUsers().then((r) => setUsers(r.users)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const admins = useMemo(() => (users ?? []).filter((u) => u.role === "admin"), [users]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (users ?? []).filter((u) => u.role !== "admin" && (u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))).slice(0, 6);
  }, [users, query]);

  async function grant(u: AdminUser) {
    setBusy(u.id);
    try {
      await api.updateUser(u.id, { role: "admin" });
      toast.success(`${u.name} can now sign in to admin`);
      setQuery("");
      load();
    } catch (e) {
      toast.error("Couldn't grant access", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  async function revoke(u: AdminUser) {
    if (!confirm(`Revoke admin access from ${u.email}?`)) return;
    setBusy(u.id);
    try {
      await api.updateUser(u.id, { role: "user" });
      toast.success(`Admin revoked from ${u.name}`);
      load();
    } catch (e) {
      toast.error("Couldn't revoke", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!users)
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Grant access */}
      <Card>
        <h3 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" /> Grant admin access</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Search an existing account and promote it. They can then sign in here with their own password.
        </p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name or email…" className="pl-9" />
        </div>
        {query && (
          <div className="mt-2 space-y-1">
            {matches.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">No non-admin users match.</p>
            ) : (
              matches.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm">{u.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Button size="sm" loading={busy === u.id} onClick={() => grant(u)}><ShieldCheck className="h-3.5 w-3.5" /> Make admin</Button>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Current admins */}
      <Card>
        <h3 className="text-sm font-semibold">Current admins ({admins.length})</h3>
        <div className="mt-3 space-y-2">
          {admins.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {u.name} {u.id === meId && <Badge tone="violet">you</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => revoke(u)} disabled={u.id === meId} className="text-destructive hover:text-destructive" title={u.id === meId ? "You can't revoke yourself" : "Revoke"}>
                <ShieldOff className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Bootstrap config note */}
      <Card className="border-dashed">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-amber-300" /> Credentials & bootstrap</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Admins are regular accounts with the <code className="rounded bg-muted px-1">admin</code> role — set them here, or edit the
          allowlist file and run the bootstrap script:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[11px] text-cyan-200">
{`admin/config/admins.json   ← list admin emails here
npm --workspace @skillstreak/admin run grant-admin`}
        </pre>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          The script promotes every email in that file to admin (creating a bootstrap admin when the DB has none).
        </p>
      </Card>
    </div>
  );
}
