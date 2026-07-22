"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, type AdminTopic } from "@/lib/api";
import { Badge, Button, Card, Input, Select, Textarea } from "./ui";

const DIFFICULTIES = ["easy", "standard", "hard"] as const;
const PHASES = ["foundations", "core", "advanced"] as const;

type Draft = { title: string; summary: string; difficulty: string; phase: string };

export function Topics() {
  const [topics, setTopics] = useState<AdminTopic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.listTopics().then((r) => setTopics(r.topics)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const domains = useMemo(() => {
    const map = new Map<string, string>();
    (topics ?? []).forEach((t) => map.set(t.domain.slug, t.domain.name));
    return [...map.entries()];
  }, [topics]);

  const filtered = useMemo(() => {
    let list = topics ?? [];
    if (domainFilter) list = list.filter((t) => t.domain.slug === domainFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
    return list;
  }, [topics, search, domainFilter]);

  function startEdit(t: AdminTopic) {
    setCreating(false);
    setEditing(t.id);
    setDraft({ title: t.title, summary: t.summary, difficulty: t.difficulty, phase: t.phase });
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setSaving(true);
    try {
      await api.updateTopic(id, draft);
      toast.success("Topic updated");
      setEditing(null);
      setDraft(null);
      load();
    } catch (e) {
      toast.error("Update failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: AdminTopic) {
    if (!confirm(`Delete "${t.title}"? This removes it from the live site and cascades user progress for it.`)) return;
    try {
      await api.deleteTopic(t.id);
      toast.success("Topic deleted");
      load();
    } catch (e) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : "" });
    }
  }

  async function createTopic() {
    if (!draft || !domainFilter) return;
    setSaving(true);
    try {
      await api.createTopic({ domainSlug: domainFilter, ...draft });
      toast.success("Topic created");
      setCreating(false);
      setDraft(null);
      load();
    } catch (e) {
      toast.error("Create failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!topics)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading topics…
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics…" className="pl-9" />
        </div>
        <Select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option value="">All domains</option>
          {domains.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </Select>
        <Button
          size="sm"
          onClick={() => {
            if (!domainFilter) { toast.info("Pick a domain first (the new topic is added to it)."); return; }
            setEditing(null);
            setCreating(true);
            setDraft({ title: "", summary: "", difficulty: "standard", phase: "core" });
          }}
        >
          <Plus className="h-4 w-4" /> New topic
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} topic{filtered.length === 1 ? "" : "s"}</p>

      {creating && draft && (
        <Card className="border-primary/40">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">New topic · {domains.find((d) => d[0] === domainFilter)?.[1]}</h3>
            <button onClick={() => { setCreating(false); setDraft(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <DraftForm draft={draft} setDraft={setDraft} />
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setDraft(null); }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={createTopic} disabled={!draft.title || !draft.summary}>Create</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((t) => (
          <Card key={t.id} className="p-4">
            {editing === t.id && draft ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <Badge>{t.domain.name}</Badge>
                  <button onClick={() => { setEditing(null); setDraft(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <DraftForm draft={draft} setDraft={setDraft} />
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDraft(null); }}>Cancel</Button>
                  <Button size="sm" loading={saving} onClick={() => saveEdit(t.id)}>Save</Button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">#{t.orderIndex}</span>
                    <span className="font-medium">{t.title}</span>
                    <Badge tone="cyan">{t.domain.name}</Badge>
                    <Badge tone={t.difficulty === "hard" ? "amber" : "muted"}>{t.difficulty}</Badge>
                    <Badge tone="violet">{t.phase}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.summary}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{t.completedBy} completed · {t.quizAttempts} quiz attempts</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function DraftForm({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Title</label>
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={200} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Summary</label>
        <Textarea rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} maxLength={500} />
      </div>
      <div className="flex gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Difficulty</label>
          <Select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Phase</label>
          <Select value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })}>
            {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
