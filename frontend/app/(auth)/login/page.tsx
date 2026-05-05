"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowUp, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { apiErrorMessage, fetchMe, loginUser } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useAuthForm } from "../auth-form-context";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useUserStore((s) => s.setAuth);
  const setMe = useUserStore((s) => s.setMe);
  const reduce = useReducedMotion();

  const [formError, setFormError] = useState<string | null>(null);
  const [errorBumpKey, setErrorBumpKey] = useState(0); // increment to re-trigger shake
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Publish form interaction to the auth context so the side-panel characters
  // can react (lean toward the form when typing, peek if password is shown).
  const { setIsTyping, setPasswordLength, setPasswordVisible } = useAuthForm();

  useEffect(() => {
    setPasswordVisible(showPassword);
  }, [showPassword, setPasswordVisible]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting, isValid, isSubmitted },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const password = watch("password");
  useEffect(() => {
    setPasswordLength(password?.length ?? 0);
  }, [password, setPasswordLength]);

  // Top-site touch: detect Caps Lock so the password field can warn before
  // submission (a common reason "wrong password" errors happen).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // getModifierState is reliable across browsers for the lock keys.
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

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const { user, token } = await loginUser(values);
      setAuth(user, token);
      const me = await fetchMe();
      setMe(me);
      router.replace(me.user.profile ? "/dashboard" : "/onboarding");
    } catch (err) {
      // 401 from /auth/login is an EXPECTED outcome (wrong credentials), not
      // a programming bug. Surface the message inline; don't let it bubble up
      // as a runtime error that triggers the Next.js dev error indicator.
      const msg = apiErrorMessage(err, "Invalid email or password");
      setFormError(msg);
      setErrorBumpKey((k) => k + 1);
      setFailedAttempts((n) => n + 1);
      try {
        setValue("password", "");
        setTimeout(() => {
          try {
            setFocus("password");
          } catch {
            /* form may have unmounted between attempts — ignore */
          }
        }, 0);
      } catch {
        /* defensive: never let post-error housekeeping throw */
      }
    }
  };

  const errorState = !!formError;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick up your streak where you left off.
      </p>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
        // Re-key on every error to retrigger the shake animation.
        key={`form-${errorBumpKey}`}
        animate={
          errorState && !reduce
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={`mt-1.5 transition-colors ${
              errorState ? "border-destructive/60 focus-visible:ring-destructive" : ""
            }`}
            aria-invalid={!!errors.email || errorState}
            placeholder="you@example.com"
            {...register("email", {
              onChange: () => {
                setIsTyping(true);
                if (errorState) setFormError(null);
              },
              onBlur: () => setIsTyping(false),
            })}
            onFocus={() => setIsTyping(true)}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {failedAttempts > 0 && (
              <Link
                href="#"
                className="text-xs font-medium text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Reset hook — to keep parity, no real reset flow is wired yet.
                  // Hint at parity with top sites by surfacing the action.
                }}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`pr-10 transition-colors ${
                errorState ? "border-destructive/60 focus-visible:ring-destructive" : ""
              }`}
              aria-invalid={!!errors.password || errorState}
              placeholder="••••••••"
              {...register("password", {
                onChange: () => {
                  setIsTyping(true);
                  if (errorState) setFormError(null);
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

          {/* Caps Lock warning — only shows while the password field is
              focused (or has content) and Caps Lock is on. */}
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
            <div className="flex-1">
              <p className="font-medium leading-tight">{formError}</p>
              {failedAttempts >= 2 && (
                <p className="mt-1 text-xs text-destructive/80">
                  Trouble signing in? Try{" "}
                  <Link
                    href="/register"
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    creating an account
                  </Link>{" "}
                  if you don't have one yet.
                </p>
              )}
            </div>
          </motion.div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || (isSubmitted && !isValid)}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </motion.form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SkillStreak?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
