import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMenuItem, getReviews } from "@/lib/queries";
import { StarIcon } from "@/components/Icons";
import { AddToCartButton, FavoriteButton } from "@/components/CartControls";

type Props = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  await connectDB();
  const [item, reviews] = await Promise.all([
    getMenuItem(id, session?.userId ?? ""),
    getReviews({ itemId: id, limit: 20 }),
  ]);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-lg bg-gradient-to-br from-[#f6e2c6] to-[#e9c99f] text-7xl font-semibold text-[#a3421f]/70">
          {item.name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-[#a3421f]">
            {item.categoryName}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold text-stone-900">{item.name}</h1>
            <FavoriteButton itemId={item.id} initial={item.isFavorite} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {item.description || "A house favorite, prepared fresh to order."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.dietaryTags.map((tag) => (
              <span key={tag} className="rounded-full bg-stone-100 px-2 py-1 text-[11px] text-stone-600">
                {tag}
              </span>
            ))}
          </div>
          {item.reviewCount > 0 && (
            <p className="mt-3 flex items-center gap-1 text-sm text-stone-600">
              <StarIcon className="h-4 w-4 text-amber-500" />
              <strong>{item.rating}</strong> from {item.reviewCount} review{item.reviewCount === 1 ? "" : "s"}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <span className="text-2xl font-bold text-stone-900">₹{item.price}</span>
            <AddToCartButton itemId={item.id} available={item.available} />
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Reviews</h2>
        {reviews.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
            No reviews yet. Complete an order to leave the first one.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.items.map((review) => (
              <article key={review.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{review.userName}</p>
                  <p className="flex items-center gap-1 text-sm text-amber-600">
                    <StarIcon className="h-3.5 w-3.5" /> {review.rating}/5
                  </p>
                </div>
                {review.comment && <p className="mt-1 text-sm text-stone-600">{review.comment}</p>}
                <p className="mt-1 text-[11px] text-stone-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
