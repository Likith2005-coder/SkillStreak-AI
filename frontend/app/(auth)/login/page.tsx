"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Watch password length and publish.
  const password = watch("password");
  useEffect(() => {
    setPasswordLength(password?.length ?? 0);
  }, [password, setPasswordLength]);

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const { user, token } = await loginUser(values);
      setAuth(user, token);
      const me = await fetchMe();
      setMe(me);
      router.replace(me.user.profile ? "/dashboard" : "/onboarding");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Login failed"));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick up your streak where you left off.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={!!errors.email}
            {...register("email", {
              onChange: () => setIsTyping(true),
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
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register("password", {
                onChange: () => setIsTyping(true),
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
          <FieldError message={errors.password?.message} />
        </div>

        {formError && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SkillStreak?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
