import type { Product } from "@/types";

export const CATEGORY_SLUGS = [
  "parfum",
  "tshirt",
  "pantolon",
  "gomlek",
  "ceket",
  "aksesuar",
  "kemer",
  "canta",
  "yeni-gelenler",
  "cok-satanlar",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type CategoryPageConfig = {
  slug: CategorySlug;
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  showPerfumeFilters: boolean;
  showClothingSizes: boolean;
  match: (product: Product) => boolean;
};

export const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const PERFUME_GENDERS = ["Women's", "Men's", "Unisex"] as const;

export const PERFUME_VOLUMES = ["30 ml", "50 ml", "100 ml"] as const;

export const PERFUME_GENDER_MAP: Record<string, (typeof PERFUME_GENDERS)[number]> = {
  "woody-amber-edp": "Unisex",
  "velvet-oud-edp": "Men's",
  "white-musk-noir": "Unisex",
  "fig-leaf-santal": "Unisex",
  "citrus-neroli-essence": "Women's",
  "rose-saffron-elixir": "Women's",
};

export const categoryPages: Record<CategorySlug, CategoryPageConfig> = {
  parfum: {
    slug: "parfum",
    title: "Parfüm",
    description:
      "Odun, amber, çiçek ve misk etrafında editorial kokular. Cilde yakın imzalar, günün ritüeline sakin bir iz bırakır.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Parfüm", href: "/parfum" },
    ],
    showPerfumeFilters: true,
    showClothingSizes: false,
    match: (product) => product.category === "Parfüm",
  },
  tshirt: {
    slug: "tshirt",
    title: "T-Shirt",
    description:
      "Yumuşak jersey ve örme siluetler; sakin lüksün temel katmanı. Oversize'dan structured omza, her günün parçası.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Giyim", href: "/tshirt" },
      { label: "T-Shirt", href: "/tshirt" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: true,
    match: (product) => product.category === "T-Shirt",
  },
  pantolon: {
    slug: "pantolon",
    title: "Pantolon",
    description:
      "Terzilikten dökümlü palazzoya, ölçülü paça ve bel hatları. Formu bozmadan duran günlük ve akşam siluetleri.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Giyim", href: "/pantolon" },
      { label: "Pantolon", href: "/pantolon" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.category === "Pantolon",
  },
  gomlek: {
    slug: "gomlek",
    title: "Gömlek",
    description:
      "Temiz yakalar, ölçülü dokumalar ve sakin bir duruş. Gömlek koleksiyonu VELORA dilinde tamamlanmak üzere.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Giyim", href: "/gomlek" },
      { label: "Gömlek", href: "/gomlek" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: true,
    match: (product) => product.category === "Gömlek",
  },
  ceket: {
    slug: "ceket",
    title: "Ceket",
    description:
      "Omuz çizgisi, sessiz yapı ve terziliğe yakın bir hacim. Ceket siluetleri yakında koleksiyona eklenecek.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Giyim", href: "/ceket" },
      { label: "Ceket", href: "/ceket" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: true,
    match: (product) => product.category === "Ceket",
  },
  aksesuar: {
    slug: "aksesuar",
    title: "Aksesuar",
    description:
      "Minimal metal bilezik, küpe ve signet yüzükler. Formun konuştuğu, abartısız parçalar.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Aksesuar", href: "/aksesuar" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.category === "Aksesuar",
  },
  kemer: {
    slug: "kemer",
    title: "Kemer",
    description:
      "İnce kayışlar, fırçalı tokalar ve sade deri işçiliği. Bel hattını yükseltmeden tamamlayan parçalar.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Aksesuar", href: "/aksesuar" },
      { label: "Kemer", href: "/kemer" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.category === "Kemer",
  },
  canta: {
    slug: "canta",
    title: "Çanta",
    description:
      "Tote, mini shoulder ve hobo formunda yumuşak grenli deriler. Günün ritmine uyan hacimler.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Aksesuar", href: "/aksesuar" },
      { label: "Çanta", href: "/canta" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.category === "Çanta",
  },
  "yeni-gelenler": {
    slug: "yeni-gelenler",
    title: "Yeni Gelenler",
    description:
      "Sezonun yeni siluetleri ve taze imzalar. VELORA'nın en son eklenen parçaları, tek bir yerde.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Yeni Gelenler", href: "/yeni-gelenler" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.isNew,
  },
  "cok-satanlar": {
    slug: "cok-satanlar",
    title: "Çok Satanlar",
    description:
      "En çok tercih edilen VELORA parçaları. Sessiz lüksün kanıtlanmış favorileri.",
    breadcrumbs: [
      { label: "Anasayfa", href: "/" },
      { label: "Çok Satanlar", href: "/cok-satanlar" },
    ],
    showPerfumeFilters: false,
    showClothingSizes: false,
    match: (product) => product.isPopular,
  },
};

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getCategoryPage(slug: string): CategoryPageConfig | undefined {
  if (!isCategorySlug(slug)) {
    return undefined;
  }

  return categoryPages[slug];
}

export function getPerfumeGender(product: Product): (typeof PERFUME_GENDERS)[number] | null {
  if (product.category !== "Parfüm") {
    return null;
  }

  return PERFUME_GENDER_MAP[product.id] ?? "Unisex";
}

export function getCategoryHref(category: string): string {
  switch (category) {
    case "T-Shirt":
      return "/tshirt";
    case "Pantolon":
      return "/pantolon";
    case "Parfüm":
      return "/parfum";
    case "Kemer":
      return "/kemer";
    case "Çanta":
      return "/canta";
    case "Aksesuar":
      return "/aksesuar";
    default:
      return "/";
  }
}
