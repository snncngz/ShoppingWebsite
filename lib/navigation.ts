export type NavLink = {
  label: string;
  href: string;
};

export type MegaMenuContent = {
  id: "parfum" | "giyim" | "aksesuar";
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
      { label: "Women's", href: "/parfum" },
      { label: "Men's", href: "/parfum" },
      { label: "Unisex", href: "/parfum" },
      { label: "New Arrivals", href: "/yeni-gelenler" },
      { label: "Best Sellers", href: "/cok-satanlar" },
    ],
    image: {
      src: "/placeholders/parfum.svg",
      alt: "VELORA parfüm",
      caption: "Parfüm",
    },
  },
  giyim: {
    id: "giyim",
    label: "Giyim",
    href: "/giyim",
    items: [
      { label: "T-Shirts", href: "/tshirt" },
      { label: "Trousers", href: "/pantolon" },
      { label: "Shirts", href: "/gomlek" },
      { label: "Jackets", href: "/ceket" },
    ],
    image: {
      src: "/placeholders/tshirt.svg",
      alt: "VELORA giyim",
      caption: "Giyim",
    },
  },
  aksesuar: {
    id: "aksesuar",
    label: "Aksesuar",
    href: "/aksesuar",
    items: [
      { label: "Belts", href: "/kemer" },
      { label: "Bags", href: "/canta" },
      { label: "Wallets", href: "/aksesuar" },
      { label: "Hats", href: "/aksesuar" },
    ],
    image: {
      src: "/placeholders/aksesuar.svg",
      alt: "VELORA aksesuar",
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
      { label: "T-Shirts", href: "/tshirt" },
      { label: "Trousers", href: "/pantolon" },
      { label: "Shirts", href: "/gomlek" },
      { label: "Jackets", href: "/ceket" },
    ],
  },
  {
    id: "parfum",
    label: "Parfüm",
    items: [
      { label: "Women's", href: "/parfum" },
      { label: "Men's", href: "/parfum" },
      { label: "Unisex", href: "/parfum" },
    ],
  },
  {
    id: "aksesuar",
    label: "Aksesuar",
    items: [
      { label: "Belts", href: "/kemer" },
      { label: "Bags", href: "/canta" },
      { label: "Wallets", href: "/aksesuar" },
    ],
  },
];

export const mobileUtilityLinks: NavLink[] = [
  { label: "Account", href: "/hesabim" },
  { label: "Wishlist", href: "/favoriler" },
  { label: "Orders", href: "/siparislerim" },
  { label: "Contact", href: "/iletisim" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
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
    title: "Customer",
    links: [
      { label: "Siparişlerim", href: "/siparislerim" },
      { label: "Kargo ve Teslimat", href: "/kargo-ve-teslimat" },
      { label: "İade ve Değişim", href: "/iade-ve-degisim" },
      { label: "SSS", href: "/sss" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "KVKK", href: "/kvkk" },
      { label: "Çerez Politikası", href: "/cerez-politikasi" },
      { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
    ],
  },
];
