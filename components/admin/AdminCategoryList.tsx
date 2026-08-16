"use client";

import { useState, type FormEvent } from "react";

import { useCatalog } from "@/context/CatalogContext";
import { commitAdminStore, type CategoryOverride } from "@/lib/adminStore";
import {
  getPlaceholderForCategory,
  isReservedCategorySlug,
  listResolvedCategories,
} from "@/lib/catalog";
import { toSlug } from "@/lib/utils";

export function AdminCategoryList() {
  const { store, refresh } = useCatalog();
  const rows = listResolvedCategories(store);
  const [creating, setCreating] = useState(false);

  const saveOverride = (slug: string, next: CategoryOverride) => {
    commitAdminStore((current) => ({
      ...current,
      categoryOverrides: {
        ...current.categoryOverrides,
        [slug]: {
          ...current.categoryOverrides[slug],
          ...next,
        },
      },
    }));
    refresh();
  };

  const toggleHidden = (slug: string, hidden: boolean) => {
    saveOverride(slug, { hidden });
  };

  const removeNew = (slug: string) => {
    if (!window.confirm("Bu kategori admin katalogundan silinsin mi?")) {
      return;
    }

    commitAdminStore((current) => {
      const overrides = { ...current.categoryOverrides };
      delete overrides[slug];
      return {
        ...current,
        newCategories: current.newCategories.filter((item) => item.slug !== slug),
        categoryOverrides: overrides,
      };
    });
    refresh();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-12 tracking-label text-taupe">Taxonomy</p>
          <h1 className="mt-3 font-heading text-32 text-black">Kategoriler</h1>
          <p className="mt-3 max-w-2xl text-14 text-taupe">
            Gizlenen kategoriler mağaza menüsünden, anasayfadan ve kategori
            sayfasından kalkar. Orijinal `data/products.ts` değişmez.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((current) => !current)}
          className="inline-flex h-12 items-center justify-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
        >
          {creating ? "Kapat" : "+ Yeni Kategori"}
        </button>
      </div>

      {creating ? (
        <div className="mt-8 border border-border bg-off-white p-6">
          <NewCategoryForm
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refresh();
            }}
          />
        </div>
      ) : null}

      <ul className="mt-10 flex flex-col gap-6">
        {rows.map((row) => (
          <li key={row.slug} className="border border-border bg-off-white p-6">
            <CategoryEditor
              slug={row.slug}
              title={row.title}
              description={row.description}
              hidden={row.hidden}
              origin={row.origin}
              onSave={(next) => saveOverride(row.slug, next)}
              onToggle={() => toggleHidden(row.slug, !row.hidden)}
              onDelete={row.origin === "new" ? () => removeNew(row.slug) : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewCategoryForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { store } = useCatalog();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = name.trim();
    if (!title) {
      setError("Kategori adı gerekli.");
      return;
    }

    const slug = toSlug(title);
    if (!slug) {
      setError("Geçerli bir kategori adı girin.");
      return;
    }

    if (
      isReservedCategorySlug(slug) ||
      listResolvedCategories(store).some((item) => item.slug === slug)
    ) {
      setError("Bu kategori yolu zaten kullanılıyor.");
      return;
    }

    commitAdminStore((current) => ({
      ...current,
      newCategories: [
        ...current.newCategories,
        {
          id: `admin-cat-${slug}`,
          slug,
          name: title,
          description: description.trim(),
          image: getPlaceholderForCategory(title),
        },
      ],
      categoryOverrides: {
        ...current.categoryOverrides,
        [slug]: {
          hidden: !visible,
        },
      },
    }));
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-12 tracking-label text-black">Yeni kategori</p>
      <label className="text-12 tracking-label text-charcoal">
        Kategori adı
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Açıklama
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 min-h-24 w-full border border-border bg-ivory px-4 py-3 text-14"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-14 text-charcoal">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        Aktif / mağazada görünür
      </label>
      {error ? <p className="text-14 text-accent">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex h-12 items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
        >
          Oluştur
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

function CategoryEditor({
  slug,
  title,
  description,
  hidden,
  origin,
  onSave,
  onToggle,
  onDelete,
}: {
  slug: string;
  title: string;
  description: string;
  hidden: boolean;
  origin: "original" | "new";
  onSave: (next: { title: string; description: string }) => void;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const [nextTitle, setNextTitle] = useState(title);
  const [nextDescription, setNextDescription] = useState(description);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          title: nextTitle.trim() || title,
          description: nextDescription.trim() || description,
        });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-12 tracking-label text-taupe">
          /{slug} · {origin === "original" ? "Orijinal" : "Admin"} ·{" "}
          {hidden ? "Gizli" : "Yayında"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-11 items-center border border-charcoal px-4 text-12 tracking-nav text-charcoal hover:bg-charcoal hover:text-ivory"
          >
            {hidden ? "Yayınla" : "Gizle"}
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-11 items-center px-4 text-12 tracking-nav text-accent"
            >
              Sil
            </button>
          ) : null}
        </div>
      </div>
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
      <button
        type="submit"
        className="inline-flex h-12 w-fit items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
      >
        Kaydet
      </button>
    </form>
  );
}
