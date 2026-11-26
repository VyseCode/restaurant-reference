import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCategories, getMenuItems, getSpecials } from "@/lib/queries";
import { MenuCard } from "@/components/MenuCard";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata = { title: "Menu" };

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = one(params.q) ?? "";
  const category = one(params.category) ?? "";
  const diet = one(params.diet) ?? "";
  const sort = one(params.sort) ?? "";
  const available = one(params.available) ?? "";
  const page = Math.max(1, Number(one(params.page) ?? 1) || 1);

  const session = await getSession();
  await connectDB();
  const [result, categories, specials] = await Promise.all([
    getMenuItems({
      q,
      category,
      diet,
      available,
      sort,
      page,
      limit: 12,
      viewerId: session?.userId ?? "",
    }),
    getCategories(true),
    getSpecials(),
  ]);

  function href(nextPage: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    if (diet) search.set("diet", diet);
    if (sort) search.set("sort", sort);
    if (available) search.set("available", available);
    search.set("page", String(nextPage));
    return `/menu?${search.toString()}`;
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Our menu</h1>
          <p className="text-sm text-stone-500">
            Freshly prepared, made to order. {result.pagination.total} dishes.
          </p>
        </div>
        {specials[0] && (
          <p className="rounded-lg border border-[#e2b98c] bg-[#fff4e4] px-3 py-2 text-xs text-[#7e3016]">
            Today&apos;s special: {specials[0].itemName} at ₹{specials[0].price}
          </p>
        )}
      </div>

      <form action="/menu" method="get" className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search dishes"
          aria-label="Search dishes"
          className="col-span-2 rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#a3421f] sm:col-span-2"
        />
        <select name="category" defaultValue={category} aria-label="Category" className="rounded-md border border-stone-200 px-2 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select name="diet" defaultValue={diet} aria-label="Dietary preference" className="rounded-md border border-stone-200 px-2 py-2 text-sm">
          <option value="">Any diet</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-free</option>
          <option value="halal">Halal</option>
          <option value="spicy">Spicy</option>
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort" className="rounded-md border border-stone-200 px-2 py-2 text-sm">
          <option value="">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="popular">Most popular</option>
          <option value="name">Name</option>
        </select>
        <div className="col-span-1 flex items-center gap-2 sm:col-span-5">
          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" name="available" value="true" defaultChecked={available === "true"} className="accent-[#a3421f]" />
            Available only
          </label>
          <button type="submit" className="ml-auto rounded-full bg-stone-900 px-5 py-1.5 text-xs font-semibold text-white">
            Apply filters
          </button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="font-medium text-stone-700">No dishes found</p>
          <p className="mt-1 text-sm text-stone-500">Try a different search or clear your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item) => <MenuCard key={item.id} item={item} />)}
        </div>
      )}

      {result.pagination.pages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
          <Link
            href={href(Math.max(1, page - 1))}
            className={`rounded-md border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-stone-100"}`}
          >
            Previous
          </Link>
          <span className="text-stone-500">Page {page} of {result.pagination.pages}</span>
          <Link
            href={href(Math.min(result.pagination.pages, page + 1))}
            className={`rounded-md border px-3 py-1.5 ${page >= result.pagination.pages ? "pointer-events-none opacity-40" : "hover:bg-stone-100"}`}
          >
            Next
          </Link>
        </nav>
      )}
    </main>
  );
}
