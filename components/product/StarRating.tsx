import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number;
  reviewCount: number;
};

export function StarRating({ rating, reviewCount }: StarRatingProps) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const rounded = Math.round(safeRating);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1" role="img" aria-label={`${safeRating} / 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={14}
            strokeWidth={1.4}
            className={
              index < rounded
                ? "fill-accent text-accent"
                : "text-warm-beige"
            }
          />
        ))}
      </div>
      <span className="text-12 text-taupe">
        {safeRating.toFixed(1)} · {reviewCount} değerlendirme
      </span>
    </div>
  );
}
