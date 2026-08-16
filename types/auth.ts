export type UserRole = "USER" | "ADMIN";

export type SessionUser = {
  userId: string;
  role: UserRole;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = SafeUser;
