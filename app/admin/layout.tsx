import type { ReactNode } from "react";
import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `Admin · ${BRAND_NAME}`,
    template: `%s · ${BRAND_NAME} Admin`,
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
