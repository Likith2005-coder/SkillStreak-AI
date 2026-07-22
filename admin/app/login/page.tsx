"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { api, setToken, clearToken } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.login(email.trim(), password);
      if (user.role !== "admin") {
        clearToken();
        setError("That account isn't an admin. Ask an existing admin to grant access.");
        return;
      }
      setToken(token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      {/* Signature backdrop: faint knowledge-grid + cyan/violet signal bloom. */}
      <div className="grid-bg signal-vignette absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            <span className="gradient-text">SkillStreak</span> Admin
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Admin credentials only · writes to the{" "}
            <span className="font-medium text-emerald-300/90">live database</span>
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              <Lock className="h-4 w-4" /> Sign in
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          Learner app runs separately on port 3000.
        </p>
      </div>
    </main>
  );
}
