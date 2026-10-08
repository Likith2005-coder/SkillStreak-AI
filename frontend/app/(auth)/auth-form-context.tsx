"use client";

/**
 * Lightweight shared state for the auth pages so the animated characters in
 * the side panel can react to what the user is doing in the form (typing,
 * password visibility, etc.).
 *
 * The form pages call setFormState(...) on focus/blur/change; the
 * AnimatedCharacters component subscribes to read it. This avoids prop-
 * drilling through the route layout.
 */

import { createContext, useContext, useMemo, useState } from "react";

type AuthFormState = {
  isTyping: boolean;
  passwordLength: number;
  passwordVisible: boolean;
};

type Ctx = AuthFormState & {
  setIsTyping: (v: boolean) => void;
  setPasswordLength: (n: number) => void;
  setPasswordVisible: (v: boolean) => void;
};

const AuthFormContext = createContext<Ctx | null>(null);

export function AuthFormProvider({ children }: { children: React.ReactNode }) {
  const [isTyping, setIsTyping] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const value = useMemo<Ctx>(
    () => ({
      isTyping,
      passwordLength,
      passwordVisible,
      setIsTyping,
      setPasswordLength,
      setPasswordVisible,
    }),
    [isTyping, passwordLength, passwordVisible]
  );

  return <AuthFormContext.Provider value={value}>{children}</AuthFormContext.Provider>;
}

export function useAuthForm(): Ctx {
  // Provider is always present in the auth route group, but if a page outside
  // the layout ever imports this we no-op gracefully.
  const ctx = useContext(AuthFormContext);
  return (
    ctx ?? {
      isTyping: false,
      passwordLength: 0,
      passwordVisible: false,
      setIsTyping: () => {},
      setPasswordLength: () => {},
      setPasswordVisible: () => {},
    }
  );
}

/**
 * Shared Midnight styling for the auth form controls. The shared <Input>
 * already carries the look (hairline well, inset shadow, volt focus halo);
 * the auth forms only make it a touch taller. Applied via className so the
 * primitive stays untouched.
 */
export const AUTH_INPUT = "h-12 text-[15px]";

/** Added on top of AUTH_INPUT when a field is invalid. */
export const AUTH_INPUT_ERROR =
  "border-destructive/60 bg-destructive/[0.06] hover:border-destructive/70 focus-visible:border-destructive focus-visible:bg-destructive/[0.06] focus-visible:shadow-[0_0_0_4px_hsl(var(--destructive)/0.18)]";

export const AUTH_LABEL = "text-sm font-medium text-foreground";
