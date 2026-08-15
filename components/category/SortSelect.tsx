import { SORT_OPTIONS, type SortValue } from "@/lib/filters";

type SortSelectProps = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="flex items-center gap-3">
      <span className="hidden text-12 tracking-nav text-taupe sm:inline">Sırala</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortValue)}
        className="h-12 max-w-[220px] border border-border bg-ivory px-3 text-12 tracking-nav text-charcoal outline-none focus:border-taupe"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
