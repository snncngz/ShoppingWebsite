"use client";

import { useState } from "react";

import { useCatalog } from "@/context/CatalogContext";
import { commitAdminStore } from "@/lib/adminStore";
import { CATEGORY_SLUGS, categoryPages } from "@/lib/category-pages";

export function AdminCategoryList() {
  const { store, refresh } = useCatalog();

  return (
    <div>
      <p className="text-12 tracking-label text-taupe">Taxonomy</p>
      <h1 className="mt-3 font-heading text-32 text-black">Kategoriler</h1>
      <p className="mt-3 max-w-2xl text-14 text-taupe">
        Başlık ve açıklama mağaza kategori sayfalarına yansır. Gizlenen kategori
        sayfada empty state gösterir; müşteri menüsü değiştirilmez.
      </p>

      <ul className="mt-10 flex flex-col gap-6">
        {CATEGORY_SLUGS.map((slug) => {
          const config = categoryPages[slug];
          const override = store.categoryOverrides[slug];

          return (
            <li key={slug} className="border border-border bg-off-white p-6">
              <CategoryEditor
                slug={slug}
                title={override?.title ?? config.title}
                description={override?.description ?? config.description}
                hidden={Boolean(override?.hidden)}
                onSave={(next) => {
                  commitAdminStore((current) => ({
                    ...current,
                    categoryOverrides: {
                      ...current.categoryOverrides,
                      [slug]: next,
                    },
                  }));
                  refresh();
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryEditor({
  slug,
  title,
  description,
  hidden,
  onSave,
}: {
  slug: string;
  title: string;
  description: string;
  hidden: boolean;
  onSave: (next: { title: string; description: string; hidden: boolean }) => void;
}) {
  const [nextTitle, setNextTitle] = useState(title);
  const [nextDescription, setNextDescription] = useState(description);
  const [nextHidden, setNextHidden] = useState(hidden);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          title: nextTitle.trim() || title,
          description: nextDescription.trim() || description,
          hidden: nextHidden,
        });
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-12 tracking-label text-taupe">/{slug}</p>
      <label className="text-12 tracking-label text-charcoal">
        Başlık
        <input
          value={nextTitle}
          onChange={(event) => setNextTitle(event.target.value)}
          className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Açıklama
        <textarea
          value={nextDescription}
          onChange={(event) => setNextDescription(event.target.value)}
          className="mt-2 min-h-24 w-full border border-border bg-ivory px-4 py-3 text-14"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-14 text-charcoal">
        <input
          type="checkbox"
          checked={nextHidden}
          onChange={(event) => setNextHidden(event.target.checked)}
        />
        Mağazada gizle
      </label>
      <button
        type="submit"
        className="inline-flex h-12 w-fit items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
      >
        Kaydet
      </button>
    </form>
  );
}
