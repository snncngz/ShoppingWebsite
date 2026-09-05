"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/category/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminApiError, getAdminErrorMessage } from "@/lib/adminApi";
import { listAdminApiCategories } from "@/lib/adminCategories";
import {
  createAdminApiProduct,
  getAdminApiProduct,
  readPerfumeDetails,
  updateAdminApiProduct,
  uploadAdminProductImage,
} from "@/lib/adminProducts";
import { CATEGORY_PLACEHOLDERS, getPlaceholderForCategory } from "@/lib/catalog";
import { CATEGORY_NAMES } from "@/lib/constants";
import { toSlug } from "@/lib/utils";
import type { CategoryChildDto, CategoryDto, ProductDto } from "@/types/api";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryChildDto[];
};

function activeChildren(nodes: CategoryChildDto[]): CategoryNode[] {
  return nodes
    .filter((node) => node.isActive)
    .map((node) => ({
      id: node.id,
      name: node.name,
      slug: node.slug,
      children: node.children,
    }));
}

function findCategoryNode(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findCategoryNode(activeChildren(node.children), id);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

function productCategoryPath(product?: ProductDto | null): string[] {
  if (!product) {
    return [];
  }

  const ids: string[] = [];
  let current: ProductDto["category"] | null = product.category;
  while (current) {
    ids.unshift(current.id);
    current = current.parent;
  }
  return ids;
}

function isPerfumeNode(node?: CategoryNode): boolean {
  return node?.slug === "parfum" || node?.name === "Parfüm";
}

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none focus:border-taupe";
const areaClass =
  "mt-2 min-h-28 w-full border border-border bg-ivory px-4 py-3 text-14 text-charcoal outline-none focus:border-taupe";

const MAX_IMAGES = 6;
const PLACEHOLDER_SET = new Set(Object.values(CATEGORY_PLACEHOLDERS));

function isPlaceholderImage(src: string): boolean {
  return PLACEHOLDER_SET.has(src) || src.startsWith("/placeholders/");
}

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

type AdminProductFormProps = {
  productId?: string;
};

export function AdminProductForm({ productId }: AdminProductFormProps) {
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    productId ? "loading" : "ready",
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setLoadError("");

    void getAdminApiProduct(productId)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setProduct(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (error instanceof AdminApiError && error.code === "NOT_FOUND") {
          setStatus("missing");
          return;
        }
        setLoadError(getAdminErrorMessage(error));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (status === "loading") {
    return <p className="text-12 tracking-label text-taupe">Yükleniyor</p>;
  }

  if (status === "missing") {
    return (
      <EmptyState
        title="Ürün bulunamadı"
        message="Bu kayıt veritabanında yok."
        actionHref="/admin/urunler"
        actionLabel="Ürünlere dön"
      />
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => {
          if (!productId) {
            return;
          }
          setStatus("loading");
          void getAdminApiProduct(productId)
            .then((data) => {
              setProduct(data);
              setStatus("ready");
            })
            .catch((error) => {
              if (error instanceof AdminApiError && error.code === "NOT_FOUND") {
                setStatus("missing");
                return;
              }
              setLoadError(getAdminErrorMessage(error));
              setStatus("error");
            });
        }}
      />
    );
  }

  return (
    <AdminProductFormFields
      key={product?.id ?? "new"}
      product={product}
    />
  );
}

function AdminProductFormFields({ product }: { product?: ProductDto | null }) {
  const router = useRouter();
  const existing = product ?? undefined;
  const isCreate = !existing;
  const perfume = readPerfumeDetails(existing?.perfumeDetails);
  const initialPath = productCategoryPath(existing);
  const initialCategoryName =
    existing?.category.parent?.parent?.name ??
    existing?.category.parent?.name ??
    existing?.category.name ??
    "T-Shirt";

  const [name, setName] = useState(existing?.name ?? "");
  const [categoryPath, setCategoryPath] = useState<string[]>(initialPath);
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [oldPrice, setOldPrice] = useState(
    existing?.oldPrice ? String(existing.oldPrice) : "",
  );
  const [campaignPercent, setCampaignPercent] = useState(
    existing?.campaignPercent ? String(existing.campaignPercent) : "",
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [colors, setColors] = useState((existing?.colors ?? ["Siyah"]).join(", "));
  const [sizes, setSizes] = useState(
    (existing?.sizes?.length
      ? existing.sizes
      : SIZE_PRESETS["T-Shirt"]
    ).join(", "),
  );
  const [stock, setStock] = useState(String(existing?.stock ?? 12));
  const [badge, setBadge] = useState(existing?.badge ?? "");
  const [isNew, setIsNew] = useState(existing?.isNew ?? true);
  const [isPopular, setIsPopular] = useState(existing?.isPopular ?? false);
  const [images, setImages] = useState<string[]>(
    existing?.images?.length
      ? existing.images
      : [getPlaceholderForCategory(initialCategoryName)],
  );
  const [uploading, setUploading] = useState(false);
  const [fragranceFamily, setFragranceFamily] = useState(
    perfume?.fragranceFamily ?? "Odunsu",
  );
  const [topNotes, setTopNotes] = useState(
    (perfume?.topNotes ?? ["Bergamot"]).join(", "),
  );
  const [heartNotes, setHeartNotes] = useState(
    (perfume?.heartNotes ?? ["Gül"]).join(", "),
  );
  const [baseNotes, setBaseNotes] = useState(
    (perfume?.baseNotes ?? ["Amber"]).join(", "),
  );
  const [volumeRows, setVolumeRows] = useState<
    { volume: string; price: string; oldPrice: string }[]
  >(() => {
    if (perfume?.volumePrices?.length) {
      return perfume.volumePrices.map((row) => ({
        volume: row.volume,
        price: String(row.price),
        oldPrice: row.oldPrice ? String(row.oldPrice) : "",
      }));
    }
    const volumes =
      perfume?.volume?.length
        ? perfume.volume
        : existing?.sizes?.length
          ? existing.sizes
          : ["50 ml", "100 ml"];
    return volumes.map((volume) => ({
      volume,
      price: existing ? String(existing.price) : "",
      oldPrice: existing?.oldPrice ? String(existing.oldPrice) : "",
    }));
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryRecords, setCategoryRecords] = useState<CategoryDto[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listAdminApiCategories()
      .then((categories) => {
        if (cancelled) {
          return;
        }
        setCategoryRecords(categories.filter((item) => !item.parentId));
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryRecords([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rootNodes: CategoryNode[] = categoryRecords
    .filter((item) => item.isActive)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      children: item.children,
    }));

  const selectedNodes = categoryPath
    .map((id) => findCategoryNode(rootNodes, id))
    .filter((node): node is CategoryNode => Boolean(node));
  const rootCategory = selectedNodes[0];
  const leafCategory = selectedNodes[selectedNodes.length - 1];
  const categoryName = rootCategory?.name ?? initialCategoryName;
  const isPerfume = selectedNodes.some(isPerfumeNode);

  const selectLevels: { label: string; value: string; options: CategoryNode[] }[] = [];
  let levelOptions = rootNodes;
  for (let index = 0; index <= categoryPath.length; index += 1) {
    if (levelOptions.length === 0) {
      break;
    }
    selectLevels.push({
      label: `${index + 1}. kategori`,
      value: categoryPath[index] ?? "",
      options: levelOptions,
    });
    const selected = categoryPath[index]
      ? findCategoryNode(rootNodes, categoryPath[index])
      : undefined;
    if (!selected) {
      break;
    }
    levelOptions = activeChildren(selected.children);
  }

  const handleCategoryLevelChange = (level: number, nextId: string) => {
    const nextPath = nextId
      ? [...categoryPath.slice(0, level), nextId]
      : categoryPath.slice(0, level);
    setCategoryPath(nextPath);

    const nextRoot =
      (nextPath[0] ? findCategoryNode(rootNodes, nextPath[0]) : undefined) ??
      rootCategory;
    const nextName = nextRoot?.name ?? categoryName;
    setImages((current) => {
      const hasCustom = current.some((src) => !isPlaceholderImage(src));
      if (hasCustom) {
        return current;
      }
      return [getPlaceholderForCategory(nextName)];
    });
    if (level === 0) {
      setSizes((SIZE_PRESETS[nextName] ?? SIZE_PRESETS["T-Shirt"]).join(", "));
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setError("");
    setSuccess("");
    const customCount = images.filter((src) => !isPlaceholderImage(src)).length;
    const remaining = MAX_IMAGES - customCount;
    if (remaining <= 0) {
      setError(`En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadAdminProductImage(file));
      }
      setImages((current) => {
        const withoutPlaceholders = current.filter((src) => !isPlaceholderImage(src));
        return [...withoutPlaceholders, ...uploaded].slice(0, MAX_IMAGES);
      });
      setSuccess(
        `${uploaded.length} fotoğraf yüklendi. Ürünü kaydetmeyi unutmayın.`,
      );
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (uploading) {
      setError("Fotoğraf yüklemesi bitmeden kaydedemezsiniz.");
      return;
    }

    const parsedStock = Number(stock);

    const colorList = splitList(colors).length > 0 ? splitList(colors) : ["Doğal"];
    let sizeList = splitList(sizes);
    let parsedPrice = Number(price);
    let parsedOld = oldPrice ? Number(oldPrice) : undefined;
    let volumePrices:
      | { volume: string; price: number; oldPrice?: number }[]
      | undefined;

    if (isPerfume) {
      volumePrices = volumeRows
        .map((row) => {
          const volume = row.volume.trim();
          const rowPrice = Number(row.price);
          const rowOld = row.oldPrice ? Number(row.oldPrice) : undefined;
          if (!volume || Number.isNaN(rowPrice) || rowPrice <= 0) {
            return null;
          }
          return {
            volume,
            price: rowPrice,
            oldPrice: rowOld && rowOld > rowPrice ? rowOld : undefined,
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row));

      if (volumePrices.length === 0) {
        setError("En az bir hacim ve fiyat girin.");
        return;
      }

      sizeList = volumePrices.map((row) => row.volume);
      parsedPrice = volumePrices[0].price;
      parsedOld = volumePrices[0].oldPrice;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Ad, açıklama ve geçerli bir fiyat gerekli.");
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError("Ad, açıklama ve geçerli bir fiyat gerekli.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError("Stok sıfır veya daha büyük bir tam sayı olmalıdır.");
      return;
    }

    if (colorList.length === 0 || sizeList.length === 0) {
      setError("En az bir renk ve beden/hacim girin.");
      return;
    }

    if (!leafCategory) {
      setError("1. kategoriyi seçin.");
      return;
    }
    if (activeChildren(leafCategory.children).length > 0) {
      setError("Bu kategorinin alt kategorisi var. Alt kategoriyi de seçin.");
      return;
    }

    const parsedCampaign = campaignPercent ? Number(campaignPercent) : 0;
    const campaign =
      Number.isInteger(parsedCampaign) && parsedCampaign > 0 && parsedCampaign <= 90
        ? parsedCampaign
        : null;

    const slug =
      existing?.slug && !isCreate ? existing.slug : toSlug(name) || "urun";
    const discount = campaign
      ? campaign
      : parsedOld && parsedOld > parsedPrice
        ? Math.round(((parsedOld - parsedPrice) / parsedOld) * 100)
        : undefined;

    const payload = {
      name: name.trim(),
      slug,
      description: description.trim(),
      price: parsedPrice,
      oldPrice: parsedOld && parsedOld > parsedPrice ? parsedOld : null,
      discount: discount ?? null,
      stock: parsedStock,
      subcategory: selectedNodes.length > 1 ? leafCategory.name : "",
      images: images.length > 0 ? images : [getPlaceholderForCategory(categoryName)],
      colors: colorList,
      sizes: sizeList,
      isPopular,
      isNew,
      badge: badge.trim() || (campaign ? "Kampanya" : null),
      campaignPercent: campaign,
      categoryId: leafCategory.id,
      categoryName,
      rating: existing?.rating,
      reviewCount: existing?.reviewCount,
      perfumeDetails:
        isPerfume
          ? {
              volume: sizeList,
              volumePrices,
              fragranceFamily: fragranceFamily.trim() || "Odunsu",
              topNotes: splitList(topNotes),
              heartNotes: splitList(heartNotes),
              baseNotes: splitList(baseNotes),
            }
          : undefined,
    };

    setSaving(true);
    try {
      if (isCreate) {
        await createAdminApiProduct(payload);
      } else {
        await updateAdminApiProduct(existing.id, payload);
      }
      setSuccess("Kaydedildi.");
      router.push("/admin/urunler");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl">
      <p className="text-12 tracking-label text-taupe">
        {isCreate ? "Yeni" : "Düzenle"}
      </p>
      <h1 className="mt-3 font-heading text-32 text-black">
        {isCreate ? "Yeni ürün" : existing?.name}
      </h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Ürün adı
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
        </label>
        {!categoriesReady ? (
          <p className="text-12 tracking-label text-taupe sm:col-span-2">
            Kategoriler yükleniyor
          </p>
        ) : rootNodes.length === 0 ? (
          <p className="text-14 text-accent sm:col-span-2">
            Önce Kategoriler sayfasından bir kategori ekleyin.
          </p>
        ) : (
          selectLevels.map((level, index) => (
            <label key={level.label} className="text-12 tracking-label text-charcoal">
              {level.label}
              <select
                required
                value={level.value}
                onChange={(event) =>
                  handleCategoryLevelChange(index, event.target.value)
                }
                className={fieldClass}
              >
                <option value="">Seçin</option>
                {level.options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ))
        )}
        {!isPerfume ? (
          <>
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
          </>
        ) : null}
        <label className="text-12 tracking-label text-charcoal">
          Kampanya indirimi (%)
          <input
            type="number"
            min={0}
            max={90}
            value={campaignPercent}
            onChange={(event) => setCampaignPercent(event.target.value)}
            placeholder="Örn. 20"
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
        {!isPerfume ? (
        <label className="text-12 tracking-label text-charcoal sm:col-span-2">
          Beden / hacim (virgülle)
          <input value={sizes} onChange={(event) => setSizes(event.target.value)} className={fieldClass} />
        </label>
        ) : (
          <fieldset className="sm:col-span-2">
            <legend className="text-12 tracking-label text-charcoal">Hacim ve fiyat</legend>
            <p className="mt-2 text-12 text-taupe">
              İstediğiniz ml değerini ekleyin. Sitede seçilince o hacmin fiyatı görünür.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {volumeRows.map((row, index) => (
                <div key={`${row.volume}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    value={row.volume}
                    placeholder="50 ml"
                    onChange={(event) =>
                      setVolumeRows((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, volume: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={0}
                    value={row.price}
                    placeholder="Fiyat"
                    onChange={(event) =>
                      setVolumeRows((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, price: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={0}
                    value={row.oldPrice}
                    placeholder="Eski fiyat"
                    onChange={(event) =>
                      setVolumeRows((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, oldPrice: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVolumeRows((current) =>
                        current.length > 1
                          ? current.filter((_, itemIndex) => itemIndex !== index)
                          : current,
                      )
                    }
                    className="h-12 px-3 text-12 tracking-nav text-accent"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setVolumeRows((current) => [
                  ...current,
                  { volume: "", price: "", oldPrice: "" },
                ])
              }
              className="mt-3 inline-flex h-11 items-center border border-charcoal px-4 text-12 tracking-nav text-charcoal"
            >
              Hacim ekle
            </button>
          </fieldset>
        )}
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
          <legend className="text-12 tracking-label text-charcoal">Görseller</legend>
          <p className="mt-2 text-12 text-taupe">
            JPEG, PNG, WEBP veya GIF · en fazla {MAX_IMAGES} adet · dosya başına 5MB.
            Yükledikten sonra mutlaka Kaydet’e basın.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((src) => (
              <div
                key={src}
                className="relative h-28 w-28 overflow-hidden border border-border bg-off-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setImages((current) => {
                      const next = current.filter((item) => item !== src);
                      return next.length > 0
                        ? next
                        : [getPlaceholderForCategory(categoryName)];
                    })
                  }
                  className="absolute right-1 top-1 bg-charcoal/80 px-2 py-1 text-12 tracking-nav text-ivory"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
          <label className="mt-4 inline-flex h-12 cursor-pointer items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal hover:bg-warm-beige/40">
            {uploading ? "Yükleniyor…" : "Fotoğraf yükle"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading || saving}
              className="sr-only"
              onChange={(event) => {
                void handleUpload(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <div className="mt-4">
            <p className="text-12 tracking-label text-taupe">Veya hazır görsel</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_NAMES.map((item) => {
                const src = getPlaceholderForCategory(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setImages([src])}
                    className={`border px-3 py-2 text-12 tracking-nav ${
                      images.length === 1 && images[0] === src
                        ? "border-charcoal bg-charcoal text-ivory"
                        : "border-border text-charcoal"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
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
        {isPerfume ? (
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
      {success ? <p className="mt-6 text-14 text-charcoal">{success}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex h-12 items-center bg-charcoal px-8 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-50"
        >
          {saving ? "Kaydediliyor" : uploading ? "Foto yükleniyor…" : "Kaydet"}
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
