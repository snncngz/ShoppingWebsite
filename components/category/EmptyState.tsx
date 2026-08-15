type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="border border-border bg-off-white px-8 py-24 text-center">
      <p className="font-heading text-24 text-black">{title}</p>
      <p className="mt-3 text-14 text-taupe">{message}</p>
    </div>
  );
}
