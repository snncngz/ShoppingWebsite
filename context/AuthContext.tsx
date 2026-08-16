"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AUTH_STORAGE_KEY } from "@/lib/auth";
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "@/lib/authApi";
import { toStorefrontUser } from "@/lib/mappers/user";
import { getSingletonContext } from "@/lib/singleton-context";
import type { SafeUser, UserRole } from "@/types/auth";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<SafeUser>;
  logout: () => Promise<void>;
};

const AuthContext = getSingletonContext<AuthContextValue | null>(
  "__VELORA_AUTH_CONTEXT__",
  null,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);

    let cancelled = false;

    void fetchCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setAuthUser(user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authUser ? toStorefrontUser(authUser) : null,
      role: authUser?.role ?? null,
      isLoggedIn: Boolean(authUser),
      isLoading,
      login: async (email, password) => {
        const user = await loginRequest(email, password);
        setAuthUser(user);
        return user;
      },
      register: async (input) => {
        const user = await registerRequest(input);
        setAuthUser(user);
        return user;
      },
      logout: async () => {
        await logoutRequest();
        setAuthUser(null);
      },
    }),
    [authUser, isLoading],
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
