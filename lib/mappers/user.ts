import type { SafeUser } from "@/types/auth";
import type { User } from "@/types";

export function toStorefrontUser(user: SafeUser): User {
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? user.name;
  const lastName = parts.slice(1).join(" ");

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    createdAt: user.createdAt,
  };
}
