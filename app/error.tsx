"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <ErrorState onRetry={reset} />
      </div>
    </section>
  );
}
