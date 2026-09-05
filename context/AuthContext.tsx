"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AUTH_STORAGE_KEY } from "@/lib/auth";
import {
  deleteAccountRequest,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationRequest,
  verifyEmailRequest,
  updateProfileRequest,
} from "@/lib/authApi";
import { toStorefrontUser } from "@/lib/mappers/user";
import { getSingletonContext } from "@/lib/singleton-context";
import type { RegisterPendingDto, SafeUser, UserRole } from "@/types/auth";
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
  }) => Promise<RegisterPendingDto>;
  verifyEmail: (token: string) => Promise<SafeUser>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateProfile: (input: {
    name?: string;
    phone: string;
    addressTitle: string;
    addressLine: string;
    addressCity: string;
  }) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginRequest(email, password);
    setAuthUser(user);
    return user;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      return registerRequest(input);
    },
    [],
  );

  const verifyEmail = useCallback(async (token: string) => {
    const user = await verifyEmailRequest(token);
    setAuthUser(user);
    return user;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await resendVerificationRequest(email);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setAuthUser(null);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await deleteAccountRequest(password);
    setAuthUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: {
      name?: string;
      phone: string;
      addressTitle: string;
      addressLine: string;
      addressCity: string;
    }) => {
      const user = await updateProfileRequest(input);
      setAuthUser(user);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authUser ? toStorefrontUser(authUser) : null,
      role: authUser?.role ?? null,
      isLoggedIn: Boolean(authUser),
      isLoading,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      deleteAccount,
      updateProfile,
    }),
    [authUser, isLoading, login, logout, register, resendVerification, verifyEmail, deleteAccount, updateProfile],
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
