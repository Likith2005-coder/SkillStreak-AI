"use client";

import { useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { AlertCircle, ArrowUp, Eye, EyeOff, Loader2 } from "lucide-react";
// motion is kept for the error banner reveal; form itself uses a CSS shake
// to keep the hydrated DOM identical to the server-rendered shell.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { apiErrorMessage, fetchMe, loginUser } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { AUTH_INPUT, AUTH_INPUT_ERROR, AUTH_LABEL, useAuthForm } from "../auth-form-context";

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
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "all",
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
      router.replace("/dashboard");
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
      <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Pick up your streak where you left off.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`mt-7 space-y-5 ${errorBumpKey > 0 && errorState ? "animate-shake" : ""}`}
        // Re-key on every error to retrigger the CSS shake animation.
        key={`form-${errorBumpKey}`}
        noValidate
      >
        <div>
          <Label htmlFor="email" className={AUTH_LABEL}>Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={`mt-2 ${AUTH_INPUT} ${errors.email || errorState ? AUTH_INPUT_ERROR : ""}`}
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
            <Label htmlFor="password" className={AUTH_LABEL}>Password</Label>
            {failedAttempts > 0 && (
              <Link
                href="#"
                className="focus-ring rounded-md text-sm font-medium text-secondary hover:underline"
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
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`pr-14 ${AUTH_INPUT} ${errors.password || errorState ? AUTH_INPUT_ERROR : ""}`}
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
              className="focus-ring absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Caps Lock warning — only shows while the password field is
              focused (or has content) and Caps Lock is on. */}
          {capsLockOn && (password?.length ?? 0) > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-energy"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              Caps Lock is on
            </motion.p>
          )}

          <FieldError message={errors.password?.message} />
        </div>

        {formError && (
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-text"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-px h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="leading-tight">{formError}</p>
              {failedAttempts >= 2 && (
                <p className="mt-1 text-sm text-destructive-text">
                  Trouble signing in? Try{" "}
                  <Link
                    href="/register"
                    className="font-semibold underline underline-offset-2"
                  >
                    creating an account
                  </Link>{" "}
                  if you don’t have one yet.
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div>
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          {!isValid && !isSubmitting && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {errors.email
                ? "Enter a valid email address to continue"
                : errors.password
                  ? "Enter your password to continue"
                  : "Fill in both fields to continue"}
            </p>
          )}
        </div>
      </form>

      <p className="mt-7 border-t border-white/[0.06] pt-6 text-center text-[15px] text-muted-foreground">
        New to SkillStreak?{" "}
        <Link href="/register" className="focus-ring rounded-md font-semibold text-secondary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
