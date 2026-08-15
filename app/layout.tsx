import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AppProviders } from "@/context/AppProviders";
import { BRAND_NAME } from "@/lib/constants";
import { cormorant, inter } from "@/lib/fonts";

import "@/data/products";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "VELORA — sakin lüks, özenle seçilmiş siluetler ve zamansız butik parçalar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-ivory font-body text-charcoal antialiased">
        <AppProviders>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
