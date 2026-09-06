"use server";

import { redirect } from "next/navigation";

import { verifyEmail } from "@/server/services/auth";

export async function confirmEmailVerification(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirect("/dogrula?hata=eksik");
  }

  let destination = "/hesabim";
  try {
    const user = await verifyEmail(token);
    destination = user.role === "ADMIN" ? "/admin" : "/hesabim";
  } catch {
    redirect("/dogrula?hata=gecersiz");
  }

  redirect(destination);
}
