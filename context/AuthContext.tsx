"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AUTH_STORAGE_KEY, DEMO_USER } from "@/lib/auth";
import { getSingletonContext } from "@/lib/singleton-context";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
};

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string) => void;
  register: (input: { firstName: string; email: string }) => void;
  logout: () => void;
};

const AuthContext = getSingletonContext<AuthContextValue | null>(
  "__VELORA_AUTH_CONTEXT__",
  null,
);

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<User>;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.firstName === "string" &&
    typeof user.lastName === "string" &&
    typeof user.createdAt === "string"
  );
}

function parseAuth(raw: string | null): User | null {
  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as { user?: unknown; isLoggedIn?: unknown };
  if (record.isLoggedIn === false) {
    return null;
  }

  return isUser(record.user) ? record.user : isUser(parsed) ? parsed : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setUser(parseAuth(window.localStorage.getItem(AUTH_STORAGE_KEY)));
    } catch {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ isLoggedIn: Boolean(user), user }),
    );
  }, [isLoading, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isLoading,
      login: (email) => {
        setUser({
          id: DEMO_USER.id,
          email: email.trim(),
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          phone: DEMO_USER.phone,
          createdAt: DEMO_USER.createdAt,
        });
      },
      register: ({ firstName, email }) => {
        setUser({
          id: DEMO_USER.id,
          email: email.trim(),
          firstName: firstName.trim() || DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          phone: DEMO_USER.phone,
          createdAt: new Date().toISOString(),
        });
      },
      logout: () => setUser(null),
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
