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
