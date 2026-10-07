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
 * Shared playground styling for the auth form controls: a chunky field with a
 * soft grey fill and a thicker bottom edge, turning blue on focus. Applied via
 * className so the shared <Input> primitive stays untouched.
 */
export const AUTH_INPUT =
  "h-12 rounded-2xl border-2 border-b-4 border-border bg-muted/60 px-4 text-base font-semibold placeholder:font-semibold focus-visible:border-secondary-bright focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-secondary-bright/20 focus-visible:ring-offset-0";

/** Added on top of AUTH_INPUT when a field is invalid. */
export const AUTH_INPUT_ERROR =
  "border-destructive-bright bg-destructive/5 focus-visible:border-destructive-bright focus-visible:ring-destructive-bright/20";

export const AUTH_LABEL = "text-sm font-extrabold text-foreground";
