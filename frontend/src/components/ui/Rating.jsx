import { Star } from "lucide-react";

export default function Rating({ value = 0, count, size = "h-4 w-4" }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${value} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-gray-500">({count})</span>}
    </div>
  );
}