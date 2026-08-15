import { ProductDetailSkeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <ProductDetailSkeleton />
      </div>
    </section>
  );
}
