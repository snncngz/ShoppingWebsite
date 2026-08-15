"use client";

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Bir şeyler ters gitti.",
  message = "Tekrar deneyin.",
  actionLabel = "Yeniden Dene",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="border border-border bg-off-white px-6 py-16 text-center sm:px-8 sm:py-24">
      <p className="font-heading text-24 text-black">{title}</p>
      <p className="mt-3 text-14 text-taupe">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 inline-flex h-12 min-h-11 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
