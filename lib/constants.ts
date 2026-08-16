export const BRAND_NAME = "Lucien Perrin" as const;

export const CATEGORY_NAMES = [
  "T-Shirt",
  "Pantolon",
  "Parfüm",
  "Kemer",
  "Çanta",
  "Aksesuar",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const TYPE_SCALE = [12, 14, 16, 18, 24, 32, 48, 64] as const;

export const SPACING_SCALE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

export const COLORS = {
  ivory: "#F7F5F0",
  offWhite: "#FAF9F6",
  black: "#0B0B0B",
  charcoal: "#2A2825",
  warmBeige: "#D8CFC0",
  taupe: "#A8998A",
  accent: "#8B6F47",
  border: "#E5E1D8",
} as const;
