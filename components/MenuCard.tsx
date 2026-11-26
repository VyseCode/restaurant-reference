import Link from "next/link";
import type { MenuItemDTO } from "@/lib/types";
import { StarIcon } from "@/components/Icons";
import { AddToCartButton, FavoriteButton } from "@/components/CartControls";

export function MenuCard({ item }: { item: MenuItemDTO }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/menu/${item.id}`}
        className="relative flex h-36 items-center justify-center bg-gradient-to-br from-[#f6e2c6] to-[#e9c99f] text-4xl font-semibold text-[#a3421f]/70"
        aria-label={`View ${item.name}`}
      >
        {item.name.charAt(0)}
        {!item.available && (
          <span className="absolute left-2 top-2 rounded bg-stone-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Unavailable
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#a3421f]">
              {item.categoryName}
            </p>
            <Link href={`/menu/${item.id}`} className="text-base font-semibold text-stone-900 hover:underline">
              {item.name}
            </Link>
          </div>
          <FavoriteButton itemId={item.id} initial={item.isFavorite} />
        </div>

        <p className="mt-1 line-clamp-2 min-h-9 text-xs text-stone-500">
          {item.description}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {item.dietaryTags.map((tag) => (
            <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-stone-900">₹{item.price}</p>
            {item.reviewCount > 0 && (
              <p className="flex items-center gap-1 text-[11px] text-stone-500">
                <StarIcon className="h-3 w-3 text-amber-500" />
                {item.rating} ({item.reviewCount})
              </p>
            )}
          </div>
          <AddToCartButton itemId={item.id} available={item.available} />
        </div>
      </div>
    </article>
  );
}
