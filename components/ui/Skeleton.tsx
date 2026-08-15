function Pulse({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`bg-warm-beige/40 motion-reduce:animate-none motion-safe:animate-pulse ${className}`}
    />
  );
}

function LoadingStatus({ label = "Yükleniyor" }: { label?: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {label}
    </p>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <Pulse className="aspect-[4/5] w-full" />
      <Pulse className="mt-4 h-3 w-16" />
      <Pulse className="mt-3 h-5 w-3/4" />
      <Pulse className="mt-3 h-4 w-20" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true">
      <LoadingStatus />
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
      <LoadingStatus />
      <Pulse className="aspect-[4/5] w-full" />
      <div>
        <Pulse className="h-3 w-24" />
        <Pulse className="mt-4 h-10 w-3/4" />
        <Pulse className="mt-6 h-4 w-32" />
        <Pulse className="mt-8 h-20 w-full" />
        <Pulse className="mt-8 h-12 w-full" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16" aria-busy="true">
      <LoadingStatus />
      <div className="mx-auto max-w-7xl">
        <Pulse className="h-3 w-40" />
        <Pulse className="mt-8 h-10 w-64" />
        <Pulse className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-12">
          <ProductGridSkeleton />
        </div>
      </div>
    </section>
  );
}

export function CartSkeleton() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16" aria-busy="true">
      <LoadingStatus label="Sepet yükleniyor" />
      <div className="mx-auto max-w-7xl">
        <Pulse className="h-3 w-16" />
        <Pulse className="mt-4 h-10 w-40" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            <Pulse className="h-32 w-full" />
            <Pulse className="h-32 w-full" />
          </div>
          <Pulse className="h-64 w-full" />
        </div>
      </div>
    </section>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingStatus label="Arama sonuçları yükleniyor" />
      <div className="flex flex-col gap-6">
        <Pulse className="h-24 w-full" />
        <Pulse className="h-24 w-full" />
        <Pulse className="h-24 w-full" />
      </div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24" aria-busy="true">
      <LoadingStatus label="Hesap yükleniyor" />
      <div className="mx-auto max-w-5xl">
        <Pulse className="h-3 w-20" />
        <Pulse className="mt-4 h-10 w-72 max-w-full" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Pulse className="h-48 w-full" />
          <Pulse className="h-48 w-full" />
        </div>
      </div>
    </section>
  );
}
