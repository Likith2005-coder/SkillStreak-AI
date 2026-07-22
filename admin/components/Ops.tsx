"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge, Button, Card } from "./ui";

export function Ops() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.emailStatus().then((r) => setConfigured(r.configured)).catch(() => setConfigured(false));
  }, []);

  async function run(key: string, fn: () => Promise<unknown>, label: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(`${label} — done`);
    } catch (e) {
      toast.error(`${label} failed`, { description: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(null);
    }
  }

  const actions = [
    { key: "ts", label: "Send me a test streak reminder", fn: api.testStreak },
    { key: "td", label: "Send me a test weekly digest", fn: api.testDigest },
    { key: "ds", label: "Dispatch streak reminders (all eligible)", fn: api.dispatchStreaks },
    { key: "dd", label: "Dispatch weekly digests (all eligible)", fn: api.dispatchDigests },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-primary" /> Email</h3>
          {configured === null ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : configured ? (
            <Badge tone="cyan">configured</Badge>
          ) : (
            <Badge tone="amber">not configured</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {configured === false
            ? "Set RESEND_API_KEY in backend/.env to actually send. Buttons will no-op until then."
            : "Trigger the same notification jobs the scheduler runs."}
        </p>

        <div className="mt-4 space-y-2">
          {actions.map((a) => (
            <div key={a.key} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
              <span className="text-sm">{a.label}</span>
              <Button size="sm" variant="outline" loading={busy === a.key} onClick={() => run(a.key, a.fn, a.label)}>
                <Send className="h-3.5 w-3.5" /> Run
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
