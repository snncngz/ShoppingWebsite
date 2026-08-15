import { SearchResultsSkeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <SearchResultsSkeleton />
      </div>
    </section>
  );
}
