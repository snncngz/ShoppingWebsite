"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/category/EmptyState";
import { useCatalog } from "@/context/CatalogContext";
import {
  commitAdminStore,
  upsertProductOverride,
  type ProductOverride,
} from "@/lib/adminStore";
import {
  getPlaceholderForCategory,
  isOriginalProduct,
  listAdminProducts,
} from "@/lib/catalog";
import { CATEGORY_NAMES } from "@/lib/constants";
import { toSlug } from "@/lib/utils";
import type { Product } from "@/types";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none focus:border-taupe";
const areaClass =
  "mt-2 min-h-28 w-full border border-border bg-ivory px-4 py-3 text-14 text-charcoal outline-none focus:border-taupe";

const SIZE_PRESETS: Record<string, string[]> = {
  "T-Shirt": ["XS", "S", "M", "L", "XL"],
  Pantolon: ["XS", "S", "M", "L", "XL"],
  "Parfüm": ["50 ml", "100 ml"],
  Kemer: ["80", "85", "90", "95", "100"],
  "Çanta": ["Tek Beden"],
  Aksesuar: ["Tek Beden"],
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function productToOverride(product: Product): ProductOverride {
  const { id: _id, ...fields } = product;
  return fields;
}

type AdminProductFormProps = {
  productId?: string;
};

export function AdminProductForm({ productId }: AdminProductFormProps) {
  const { hydrated, refresh } = useCatalog();

  if (!hydrated) {
    return <p className="text-12 tracking-label text-taupe">Yükleniyor</p>;
  }

  return (
    <AdminProductFormFields
      productId={productId}
      refresh={refresh}
    />
  );
}

function AdminProductFormFields({
  productId,
  refresh,
}: {
  productId?: string;
  refresh: () => void;
}) {
  const router = useRouter();
  const { store } = useCatalog();
  const rows = useMemo(() => listAdminProducts(store), [store]);
  const existing = productId
    ? rows.find((row) => row.id === productId)
    : undefined;
  const isCreate = !productId;

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "T-Shirt");
  const [subcategory, setSubcategory] = useState(existing?.subcategory ?? "Essential");
  const [price, setPrice] = useState(String(existing?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(
    existing?.oldPrice ? String(existing.oldPrice) : "",
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [colors, setColors] = useState((existing?.colors ?? ["Siyah"]).join(", "));
  const [sizes, setSizes] = useState(
    (existing?.sizes ?? SIZE_PRESETS["T-Shirt"]).join(", "),
  );
  const [stock, setStock] = useState(String(existing?.stock ?? 12));
  const [badge, setBadge] = useState(existing?.badge ?? "");
  const [isNew, setIsNew] = useState(existing?.isNew ?? true);
  const [isPopular, setIsPopular] = useState(existing?.isPopular ?? false);
  const [image, setImage] = useState(
    existing?.images[0] ?? getPlaceholderForCategory(existing?.category ?? "T-Shirt"),
  );
  const [fragranceFamily, setFragranceFamily] = useState(
    existing?.perfumeDetails?.fragranceFamily ?? "Odunsu",
  );
  const [topNotes, setTopNotes] = useState(
    (existing?.perfumeDetails?.topNotes ?? ["Bergamot"]).join(", "),
  );
  const [heartNotes, setHeartNotes] = useState(
    (existing?.perfumeDetails?.heartNotes ?? ["Gül"]).join(", "),
  );
  const [baseNotes, setBaseNotes] = useState(
    (existing?.perfumeDetails?.baseNotes ?? ["Amber"]).join(", "),
  );
  const [error, setError] = useState("");

  if (productId && !existing) {
    return (
      <EmptyState
        title="Ürün bulunamadı"
        message="Bu kayıt admin katalogunda yok."
        actionHref="/admin/urunler"
        actionLabel="Ürünlere dön"
      />
    );
  }

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setImage(getPlaceholderForCategory(next));
    setSizes((SIZE_PRESETS[next] ?? SIZE_PRESETS["T-Shirt"]).join(", "));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedOld = oldPrice ? Number(oldPrice) : undefined;

    if (!name.trim() || !description.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Ad, açıklama ve geçerli bir fiyat gerekli.");
      return;
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setError("Stok sıfır veya daha büyük olmalıdır.");
      return;
    }

    const colorList = splitList(colors);
    const sizeList = splitList(sizes);
    if (colorList.length === 0 || sizeList.length === 0) {
      setError("En az bir renk ve beden/hacim girin.");
      return;
    }

    const slugBase = toSlug(name) || "urun";
    const taken = rows
      .filter((row) => row.id !== existing?.id)
      .map((row) => row.slug);
    let slug = existing?.slug && !isCreate ? existing.slug : slugBase;
    if (isCreate || slug !== existing?.slug) {
      let unique = slugBase;
      let index = 2;
      while (taken.includes(unique)) {
        unique = `${slugBase}-${index}`;
        index += 1;
      }
      slug = unique;
    }

    const id = existing?.id ?? `admin-${slug}`;
    const discount =
      parsedOld && parsedOld > parsedPrice
        ? Math.round(((parsedOld - parsedPrice) / parsedOld) * 100)
        : undefined;

    const nextProduct: Product = {
      id,
      slug,
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || "Essential",
      price: parsedPrice,
      description: description.trim(),
      images: [image],
      colors: colorList,
      sizes: sizeList,
      stock: parsedStock,
      rating: existing?.rating ?? 5,
      reviewCount: existing?.reviewCount ?? 0,
      isPopular,
      isNew,
    };

    if (parsedOld && parsedOld > parsedPrice) {
      nextProduct.oldPrice = parsedOld;
      nextProduct.discount = discount;
    }

    if (badge.trim()) {
      nextProduct.badge = badge.trim();
    }

    if (category === "Parfüm") {
      nextProduct.perfumeDetails = {
        volume: sizeList,
        fragranceFamily: fragranceFamily.trim() || "Odunsu",
        topNotes: splitList(topNotes),
        heartNotes: splitList(heartNotes),
        baseNotes: splitList(baseNotes),
      };
    }

    commitAdminStore((current) => {
      if (isOriginalProduct(id)) {
        return upsertProductOverride(current, id, {
          ...productToOverride(nextProduct),
          hidden: false,
        });
      }

      const already = current.newProducts.some((product) => product.id === id);
      return {
        ...current,
        newProducts: already
          ? current.newProducts.map((product) =>
              product.id === id ? nextProduct : product,
            )
          : [...current.newProducts, nextProduct],
      };
    });

    refresh();
    router.push("/admin/urunler");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <p className="text-12 tracking-label text-taupe">
        {isCreate ? "Create" : "Edit"}
      </p>
      <h1 className="mt-3 font-heading text-32 text-black">
        {isCreate ? "Yeni ürün" : existing?.name}
      </h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Ürün adı
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Kategori
          <select
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className={fieldClass}
          >
            {CATEGORY_NAMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Alt kategori
          <input
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Fiyat (TL)
          <input
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Eski fiyat (opsiyonel)
          <input
            type="number"
            min={0}
            value={oldPrice}
            onChange={(event) => setOldPrice(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Açıklama
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={areaClass}
          />
        </label>
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Renkler (virgülle)
          <input value={colors} onChange={(event) => setColors(event.target.value)} className={fieldClass} />
        </label>
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Beden / hacim (virgülle)
          <input value={sizes} onChange={(event) => setSizes(event.target.value)} className={fieldClass} />
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Stok
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-12 tracking-label text-charcoal">
          Rozet
          <input value={badge} onChange={(event) => setBadge(event.target.value)} className={fieldClass} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-12 tracking-label text-charcoal">Görsel</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_NAMES.map((item) => {
              const src = getPlaceholderForCategory(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setImage(src)}
                  className={`border px-3 py-2 text-12 tracking-nav ${
                    image === src
                      ? "border-charcoal bg-charcoal text-ivory"
                      : "border-border text-charcoal"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 text-14 text-charcoal">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(event) => setIsNew(event.target.checked)}
          />
          Yeni
        </label>
        <label className="flex min-h-11 items-center gap-3 text-14 text-charcoal">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(event) => setIsPopular(event.target.checked)}
          />
          Çok satan
        </label>
        {category === "Parfüm" ? (
          <>
            <label className="text-12 tracking-label text-charcoal sm:col-span-2">
              Koku ailesi
              <input
                value={fragranceFamily}
                onChange={(event) => setFragranceFamily(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="text-12 tracking-label text-charcoal">
              Üst notalar
              <input value={topNotes} onChange={(event) => setTopNotes(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-12 tracking-label text-charcoal">
              Kalp notalar
              <input
                value={heartNotes}
                onChange={(event) => setHeartNotes(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="text-12 tracking-label text-charcoal sm:col-span-2">
              Dip notalar
              <input value={baseNotes} onChange={(event) => setBaseNotes(event.target.value)} className={fieldClass} />
            </label>
          </>
        ) : null}
      </div>

      {error ? <p className="mt-6 text-14 text-accent">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex h-12 items-center bg-charcoal px-8 text-12 tracking-nav text-ivory hover:bg-black"
        >
          Kaydet
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/urunler")}
          className="inline-flex h-12 items-center border border-charcoal px-8 text-12 tracking-nav text-charcoal"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
