import type { ReactNode } from "react";

import type { FilterOptions, FilterState, StockFilter } from "@/lib/filters";
import { toggleFilterValue } from "@/lib/filters";

type FilterPanelProps = {
  options: FilterOptions;
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  showPerfumeFilters: boolean;
  showSizeFilter: boolean;
};

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-b border-border py-6">
      <legend className="text-12 tracking-label text-black">{title}</legend>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-14 text-charcoal">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-accent"
      />
      <span>{label}</span>
    </label>
  );
}

export function FilterPanel({
  options,
  value,
  onChange,
  onClear,
  showPerfumeFilters,
  showSizeFilter,
}: FilterPanelProps) {
  const parsePrice = (raw: string): number | null => {
    if (raw.trim() === "") {
      return null;
    }

    const next = Number(raw);
    return Number.isFinite(next) ? next : null;
  };

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      {options.subcategories.length > 0 ? (
        <FilterGroup title="Kategori">
          {options.subcategories.map((subcategory) => (
            <CheckboxRow
              key={subcategory}
              label={subcategory}
              checked={value.subcategories.includes(subcategory)}
              onChange={() =>
                onChange({
                  ...value,
                  subcategories: toggleFilterValue(value.subcategories, subcategory),
                })
              }
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Fiyat aralığı">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={options.priceBounds ? String(options.priceBounds.min) : "Min"}
            value={value.priceMin ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                priceMin: parsePrice(event.target.value),
              })
            }
            className="h-12 w-full border border-border bg-ivory px-3 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe"
            aria-label="Minimum fiyat"
          />
          <span className="text-12 text-taupe">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={options.priceBounds ? String(options.priceBounds.max) : "Max"}
            value={value.priceMax ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                priceMax: parsePrice(event.target.value),
              })
            }
            className="h-12 w-full border border-border bg-ivory px-3 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe"
            aria-label="Maksimum fiyat"
          />
        </div>
      </FilterGroup>

      {options.colors.length > 0 ? (
        <FilterGroup title="Renk">
          {options.colors.map((color) => (
            <CheckboxRow
              key={color}
              label={color}
              checked={value.colors.includes(color)}
              onChange={() =>
                onChange({
                  ...value,
                  colors: toggleFilterValue(value.colors, color),
                })
              }
            />
          ))}
        </FilterGroup>
      ) : null}

      {showSizeFilter && options.sizes.length > 0 ? (
        <FilterGroup title="Beden">
          {options.sizes.map((size) => (
            <CheckboxRow
              key={size}
              label={size}
              checked={value.sizes.includes(size)}
              onChange={() =>
                onChange({
                  ...value,
                  sizes: toggleFilterValue(value.sizes, size),
                })
              }
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Stok durumu">
        {([
          { value: "in", label: "Stokta var" },
          { value: "out", label: "Tükendi" },
        ] as const).map((option) => (
          <CheckboxRow
            key={option.value}
            label={option.label}
            checked={value.stock.includes(option.value)}
            onChange={() =>
              onChange({
                ...value,
                stock: toggleFilterValue(value.stock, option.value) as StockFilter[],
              })
            }
          />
        ))}
      </FilterGroup>

      {showPerfumeFilters ? (
        <>
          <FilterGroup title="Cinsiyet">
            {options.genders.map((gender) => (
              <CheckboxRow
                key={gender}
                label={gender}
                checked={value.genders.includes(gender)}
                onChange={() =>
                  onChange({
                    ...value,
                    genders: toggleFilterValue(value.genders, gender),
                  })
                }
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Hacim">
            {options.volumes.map((volume) => (
              <CheckboxRow
                key={volume}
                label={volume}
                checked={value.volumes.includes(volume)}
                onChange={() =>
                  onChange({
                    ...value,
                    volumes: toggleFilterValue(value.volumes, volume),
                  })
                }
              />
            ))}
          </FilterGroup>
        </>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        className="mt-6 text-12 tracking-nav text-taupe transition-colors hover:text-black"
      >
        Filtreleri Temizle
      </button>
    </form>
  );
}
