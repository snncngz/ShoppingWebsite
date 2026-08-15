import { X } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { FilterState } from "@/lib/filters";

type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type FilterChipsProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
};

function stockLabel(value: string): string {
  return value === "in" ? "Stokta var" : "Tükendi";
}

export function FilterChips({ filters, onChange, onClear }: FilterChipsProps) {
  const chips: FilterChip[] = [
    ...filters.subcategories.map((value) => ({
      key: `sub-${value}`,
      label: value,
      onRemove: () =>
        onChange({
          ...filters,
          subcategories: filters.subcategories.filter((item) => item !== value),
        }),
    })),
    ...filters.colors.map((value) => ({
      key: `color-${value}`,
      label: value,
      onRemove: () =>
        onChange({
          ...filters,
          colors: filters.colors.filter((item) => item !== value),
        }),
    })),
    ...filters.sizes.map((value) => ({
      key: `size-${value}`,
      label: value,
      onRemove: () =>
        onChange({
          ...filters,
          sizes: filters.sizes.filter((item) => item !== value),
        }),
    })),
    ...filters.stock.map((value) => ({
      key: `stock-${value}`,
      label: stockLabel(value),
      onRemove: () =>
        onChange({
          ...filters,
          stock: filters.stock.filter((item) => item !== value),
        }),
    })),
    ...filters.genders.map((value) => ({
      key: `gender-${value}`,
      label: value,
      onRemove: () =>
        onChange({
          ...filters,
          genders: filters.genders.filter((item) => item !== value),
        }),
    })),
    ...filters.volumes.map((value) => ({
      key: `volume-${value}`,
      label: value,
      onRemove: () =>
        onChange({
          ...filters,
          volumes: filters.volumes.filter((item) => item !== value),
        }),
    })),
  ];

  if (filters.priceMin !== null || filters.priceMax !== null) {
    const minLabel =
      filters.priceMin !== null ? formatPrice(filters.priceMin) : "Min";
    const maxLabel =
      filters.priceMax !== null ? formatPrice(filters.priceMax) : "Max";

    chips.push({
      key: "price",
      label: `${minLabel} – ${maxLabel}`,
      onRemove: () =>
        onChange({
          ...filters,
          priceMin: null,
          priceMax: null,
        }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex h-8 items-center gap-2 border border-border bg-off-white px-3 text-12 text-charcoal transition-colors hover:border-taupe"
        >
          {chip.label}
          <X size={12} strokeWidth={1.4} />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="h-8 px-2 text-12 tracking-nav text-taupe transition-colors hover:text-black"
      >
        Filtreleri Temizle
      </button>
    </div>
  );
}
