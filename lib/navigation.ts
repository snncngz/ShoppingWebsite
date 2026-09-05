export type NavLink = {
  label: string;
  href: string;
  children?: NavLink[];
};

export type MegaMenuContent = {
  id: string;
  label: string;
  href: string;
  items: NavLink[];
  image: {
    src: string;
    alt: string;
    caption: string;
  };
};

export type DesktopNavItem = {
  id: string;
  label: string;
  href: string;
  mega?: MegaMenuContent;
};

export const megaMenus: Record<MegaMenuContent["id"], MegaMenuContent> = {
  parfum: {
    id: "parfum",
    label: "Parfüm",
    href: "/parfum",
    items: [
      { label: "Kadın", href: "/parfum/womens" },
      { label: "Erkek", href: "/parfum/mens" },
      { label: "Unisex", href: "/parfum/unisex" },
      { label: "Yeni Gelenler", href: "/yeni-gelenler" },
      { label: "Çok Satanlar", href: "/cok-satanlar" },
    ],
    image: {
      src: "/brand/resim10.jpeg",
      alt: "Lucien Perrin parfüm",
      caption: "Parfüm",
    },
  },
  giyim: {
    id: "giyim",
    label: "Giyim",
    href: "/giyim",
    items: [
      { label: "T-Shirt", href: "/tshirt" },
      { label: "Pantolon", href: "/pantolon" },
      { label: "Gömlek", href: "/gomlek" },
      { label: "Ceket", href: "/ceket" },
    ],
    image: {
      src: "/placeholders/tshirt.svg",
      alt: "Lucien Perrin giyim",
      caption: "Giyim",
    },
  },
  aksesuar: {
    id: "aksesuar",
    label: "Aksesuar",
    href: "/aksesuar",
    items: [
      { label: "Kemer", href: "/kemer" },
      { label: "Çanta", href: "/canta" },
      { label: "Cüzdan", href: "/aksesuar" },
      { label: "Şapka", href: "/aksesuar" },
    ],
    image: {
      src: "/placeholders/aksesuar.svg",
      alt: "Lucien Perrin aksesuar",
      caption: "Aksesuar",
    },
  },
};

export const desktopNavItems: DesktopNavItem[] = [
  { id: "parfum", label: "Parfüm", href: "/parfum", mega: megaMenus.parfum },
  { id: "giyim", label: "Giyim", href: "/giyim", mega: megaMenus.giyim },
  { id: "aksesuar", label: "Aksesuar", href: "/aksesuar", mega: megaMenus.aksesuar },
  { id: "yeni-gelenler", label: "Yeni Gelenler", href: "/yeni-gelenler" },
  { id: "cok-satanlar", label: "Çok Satanlar", href: "/cok-satanlar" },
];

export const mobileAccordions: {
  id: MegaMenuContent["id"];
  label: string;
  items: NavLink[];
}[] = [
  {
    id: "giyim",
    label: "Giyim",
    items: [
      { label: "T-Shirt", href: "/tshirt" },
      { label: "Pantolon", href: "/pantolon" },
      { label: "Gömlek", href: "/gomlek" },
      { label: "Ceket", href: "/ceket" },
    ],
  },
  {
    id: "parfum",
    label: "Parfüm",
    items: [
      { label: "Kadın", href: "/parfum/womens" },
      { label: "Erkek", href: "/parfum/mens" },
      { label: "Unisex", href: "/parfum/unisex" },
    ],
  },
  {
    id: "aksesuar",
    label: "Aksesuar",
    items: [
      { label: "Kemer", href: "/kemer" },
      { label: "Çanta", href: "/canta" },
      { label: "Cüzdan", href: "/aksesuar" },
    ],
  },
];

export const mobileUtilityLinks: NavLink[] = [
  { label: "Hesabım", href: "/hesabim" },
  { label: "Favoriler", href: "/favoriler" },
  { label: "Siparişlerim", href: "/siparislerim" },
  { label: "İletişim", href: "/iletisim" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Mağaza",
    links: [
      { label: "Parfüm", href: "/parfum" },
      { label: "T-Shirt", href: "/tshirt" },
      { label: "Pantolon", href: "/pantolon" },
      { label: "Gömlek", href: "/gomlek" },
      { label: "Aksesuar", href: "/aksesuar" },
      { label: "Yeni Gelenler", href: "/yeni-gelenler" },
      { label: "Çok Satanlar", href: "/cok-satanlar" },
    ],
  },
  {
    title: "Müşteri",
    links: [
      { label: "Siparişlerim", href: "/siparislerim" },
      { label: "Kargo ve Teslimat", href: "/kargo-ve-teslimat" },
      { label: "İade ve Değişim", href: "/iade-ve-degisim" },
      { label: "SSS", href: "/sss" },
    ],
  },
  {
    title: "Hakkımızda",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "KVKK", href: "/kvkk" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
      { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
    ],
  },
];
