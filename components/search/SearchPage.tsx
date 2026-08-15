import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { SearchPanel } from "@/components/search/SearchPanel";

type SearchPageProps = {
  initialQuery: string;
};

export function SearchPage({ initialQuery }: SearchPageProps) {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: "Arama", href: "/arama" },
          ]}
        />
        <p className="mt-8 text-12 tracking-label text-taupe">Search</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Arama</h1>
        <div className="mt-10">
          <SearchPanel variant="page" initialQuery={initialQuery} />
        </div>
      </div>
    </section>
  );
}
