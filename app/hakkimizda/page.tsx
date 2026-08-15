import type { Metadata } from "next";

import { AboutPage } from "@/components/content/AboutPage";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "VELORA — Nişantaşı’nda giyim, parfüm ve aksesuarı aynı sakin lüks dilinde birleştiren butik.",
};

export default function HakkimizdaRoute() {
  return <AboutPage />;
}
