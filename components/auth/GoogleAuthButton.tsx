export function GoogleAuthButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google"
      className="inline-flex h-12 w-full items-center justify-center gap-3 border border-charcoal text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
        <path d="M12 22c2.7 0 4.97-.9 6.63-2.35l-3.24-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z" />
        <path d="M6.4 13.99A6.01 6.01 0 0 1 6.08 12c0-.69.12-1.36.32-1.99V7.43H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.57l3.34-2.58Z" />
        <path d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87C16.96 2.97 14.7 2 12 2 7.94 2 4.43 4.33 3.06 7.43l3.34 2.58C7.19 7.72 9.4 5.96 12 5.96Z" />
      </svg>
      {label}
    </a>
  );
}
