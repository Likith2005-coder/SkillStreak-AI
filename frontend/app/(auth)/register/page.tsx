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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useUserStore((s) => s.setAuth);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { setIsTyping, setPasswordLength, setPasswordVisible } = useAuthForm();
  useEffect(() => {
    setPasswordVisible(showPassword);
  }, [showPassword, setPasswordVisible]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const password = watch("password");
  useEffect(() => {
    setPasswordLength(password?.length ?? 0);
  }, [password, setPasswordLength]);

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      const { user, token } = await registerUser(values);
      setAuth(user, token);
      router.replace("/onboarding");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start your streak in under a minute.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            className="mt-1.5"
            aria-invalid={!!errors.name}
            {...register("name", {
              onChange: () => setIsTyping(true),
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
              autoComplete="new-password"
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
          <p className="mt-1 text-xs text-muted-foreground">
            Use at least 8 characters. Mix it up.
          </p>
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
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
