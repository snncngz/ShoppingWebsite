import Link from "next/link";

type EmptyStateProps = {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border border-border bg-off-white px-6 py-16 text-center sm:px-8 sm:py-24">
      <p className="font-heading text-24 text-black">{title}</p>
      <p className="mt-3 text-14 text-taupe">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex h-12 min-h-11 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
        >
          {actionLabel}
        </button>
      ) : null}
      {actionLabel && actionHref && !onAction ? (
        <Link
          href={actionHref}
          className="mt-8 inline-flex h-12 min-h-11 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
