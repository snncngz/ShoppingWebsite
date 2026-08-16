import type { Metadata } from "next";

import { StorefrontFrame } from "@/components/layout/StorefrontFrame";
import { AppProviders } from "@/context/AppProviders";
import { BRAND_NAME } from "@/lib/constants";
import { cormorant, inter } from "@/lib/fonts";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — Sakin Lüks Butik`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "VELORA — sakin lüks, özenle seçilmiş siluetler ve zamansız butik parçalar.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Sakin Lüks Butik`,
    description:
      "VELORA — sakin lüks, özenle seçilmiş siluetler ve zamansız butik parçalar.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-ivory font-body text-charcoal antialiased">
        <AppProviders>
          <StorefrontFrame>{children}</StorefrontFrame>
        </AppProviders>
      </body>
    </html>
  );
}
