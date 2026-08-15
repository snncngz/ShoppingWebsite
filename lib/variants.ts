import type { Product } from "@/types";

export type VariantConfig = {
  isPerfume: boolean;
  colors: string[];
  options: string[];
  optionLabel: "Hacim" | "Beden";
  requiresModal: boolean;
};

export function getVariantConfig(product: Product): VariantConfig {
  const isPerfume = Boolean(product.perfumeDetails);
  const colors = product.colors;
  const options = isPerfume
    ? (product.perfumeDetails?.volume ?? [])
    : product.sizes;
  const selectableOptions = isPerfume
    ? options
    : options.filter((size) => size !== "Tek Beden");

  return {
    isPerfume,
    colors,
    options,
    optionLabel: isPerfume ? "Hacim" : "Beden",
    requiresModal:
      colors.length > 1 ||
      selectableOptions.length > 1 ||
      (isPerfume && options.length > 1),
  };
}

export function getDefaultCartVariant(product: Product): {
  color: string;
  size: string;
} {
  const config = getVariantConfig(product);

  return {
    color: config.colors[0] ?? "",
    size: config.options[0] ?? "",
  };
}
