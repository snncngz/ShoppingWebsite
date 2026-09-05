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
  emailVerified: boolean;
  phone: string;
  addressTitle: string;
  addressLine: string;
  addressCity: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterPendingDto = {
  pendingVerification: true;
  email: string;
  verificationToken?: string;
};

export type AuthUser = SafeUser;
