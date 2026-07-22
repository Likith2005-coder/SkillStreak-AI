"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowUp, Check, Eye, EyeOff, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { apiErrorMessage, registerUser } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useAuthForm } from "../auth-form-context";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72, "72 characters or fewer"),
});
type RegisterValues = z.infer<typeof registerSchema>;

type FieldKind = "name" | "email" | "password" | null;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useUserStore((s) => s.setAuth);
  const reduce = useReducedMotion();

  const [formError, setFormError] = useState<string | null>(null);
  const [errorBumpKey, setErrorBumpKey] = useState(0);
  const [errorField, setErrorField] = useState<FieldKind>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { setIsTyping, setPasswordLength, setPasswordVisible } = useAuthForm();
  useEffect(() => {
    setPasswordVisible(showPassword);
  }, [showPassword, setPasswordVisible]);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
    // "all" → validation runs on every change AND every blur, so isValid is
    // always live. We use it to gate the submit button so the user can't
    // even attempt to submit a form that wouldn't pass Zod.
    mode: "all",
    reValidateMode: "onChange",
  });

  const password = watch("password");
  useEffect(() => {
    setPasswordLength(password?.length ?? 0);
  }, [password, setPasswordLength]);

  // Caps Lock detection — same UX touch as login.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (typeof e.getModifierState === "function") {
        setCapsLockOn(e.getModifierState("CapsLock"));
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  // Live password strength meter — visible only once the user starts typing.
  const strength = useMemo(() => scorePassword(password ?? ""), [password]);

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    setErrorField(null);
    try {
      const { user, token } = await registerUser(values);
      setAuth(user, token);
      router.replace("/onboarding");
    } catch (err) {
      const msg = apiErrorMessage(err, "We couldn't create your account.");
      // The backend uses 409 with "An account with that email already exists".
      // Surface that under the email field specifically.
      const isDup = /account with that email already exists/i.test(msg);
      setFormError(isDup ? "An account with that email already exists. Try signing in instead." : msg);
      setErrorField(isDup ? "email" : null);
      setErrorBumpKey((k) => k + 1);
      if (isDup) setTimeout(() => setFocus("email"), 0);
    }
  };

  // A field is visually "invalid" if RHF has a Zod error for it OR the
  // backend flagged it (e.g. 409 email-already-exists).
  const fieldInvalid = (k: keyof RegisterValues) => !!errors[k] || errorField === k;
  const errorClass = (k: keyof RegisterValues) =>
    fieldInvalid(k) ? "border-destructive/60 focus-visible:ring-destructive" : "";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start your streak in under a minute.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`mt-6 space-y-4 ${errorBumpKey > 0 && formError ? "animate-shake" : ""}`}
        key={`form-${errorBumpKey}`}
        noValidate
      >
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            className={`mt-1.5 transition-colors ${errorClass("name")}`}
            aria-invalid={!!errors.name}
            {...register("name", {
              onChange: () => {
                setIsTyping(true);
                if (formError) setFormError(null);
              },
              onBlur: () => setIsTyping(false),
            })}
            onFocus={() => setIsTyping(true)}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`mt-1.5 transition-colors ${errorClass("email")}`}
            aria-invalid={!!errors.email || errorField === "email"}
            {...register("email", {
              onChange: () => {
                setIsTyping(true);
                if (formError) setFormError(null);
              },
              onBlur: () => setIsTyping(false),
            })}
            onFocus={() => setIsTyping(true)}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`pr-10 transition-colors ${errorClass("password")}`}
              aria-invalid={!!errors.password}
              {...register("password", {
                onChange: () => {
                  setIsTyping(true);
                  if (formError) setFormError(null);
                },
                onBlur: () => setIsTyping(false),
              })}
              onFocus={() => setIsTyping(true)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {capsLockOn && (password?.length ?? 0) > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-amber-400"
            >
              <ArrowUp className="h-3 w-3" />
              Caps Lock is on
            </motion.p>
          )}

          <FieldError message={errors.password?.message} />

          {/* Live password strength meter */}
          {(password?.length ?? 0) > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex h-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      i < strength.score
                        ? strength.score === 1
                          ? "bg-rose-500"
                          : strength.score === 2
                            ? "bg-amber-500"
                            : strength.score === 3
                              ? "bg-emerald-500"
                              : "bg-emerald-400"
                        : "bg-muted/40"
                    }`}
                  />
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <Rule ok={strength.checks.length}>8+ characters</Rule>
                <Rule ok={strength.checks.mix}>Letters + numbers</Rule>
                <Rule ok={strength.checks.case}>Upper + lower case</Rule>
                <Rule ok={strength.checks.symbol}>A symbol</Rule>
              </ul>
            </div>
          )}
        </div>

        {formError && (
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium leading-tight">
              {formError}{" "}
              {errorField === "email" && (
                <Link
                  href="/login"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  Sign in →
                </Link>
              )}
            </p>
          </motion.div>
        )}

        <div>
          <Button
            type="submit"
            className="w-full"
            // Disabled until every field passes Zod. With mode:"all" isValid is
            // live, so the button can only fire when the form is genuinely
            // submittable — no chance of "Creating account…" with a bad email.
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
          {/* Tell the user WHY the button is grey — top-site UX pattern */}
          {!isValid && !isSubmitting && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {nextHint(errors, password ?? "")}
            </p>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`inline-flex items-center gap-1 ${ok ? "text-emerald-400" : "text-muted-foreground"}`}
    >
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
      {children}
    </li>
  );
}

function nextHint(
  errors: Record<string, { message?: string } | undefined>,
  password: string
): string {
  if (errors.name) return "Enter your full name to continue";
  if (errors.email) return "Enter a valid email address to continue";
  if (errors.password) {
    if (!password) return "Pick a password to continue";
    if (password.length < 8) return "Password needs at least 8 characters";
    return errors.password.message ?? "Fix the password to continue";
  }
  return "Fill in all fields to continue";
}

function scorePassword(p: string): {
  score: 0 | 1 | 2 | 3 | 4;
  checks: { length: boolean; mix: boolean; case: boolean; symbol: boolean };
} {
  const length = p.length >= 8;
  const mix = /[a-z]/i.test(p) && /\d/.test(p);
  const caseMix = /[a-z]/.test(p) && /[A-Z]/.test(p);
  const symbol = /[^A-Za-z0-9]/.test(p);
  const passed = [length, mix, caseMix, symbol].filter(Boolean).length;
  return {
    score: passed as 0 | 1 | 2 | 3 | 4,
    checks: { length, mix, case: caseMix, symbol },
  };
}
