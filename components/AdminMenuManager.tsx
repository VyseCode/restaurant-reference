"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CategoryDTO, MenuItemDTO } from "@/lib/types";
import { DIETARY_TAGS } from "@/lib/constants";
import { ActionButton } from "@/components/ActionButton";

export function AdminMenuManager({
  categories,
  items,
}: {
  categories: CategoryDTO[];
  items: MenuItemDTO[];
}) {
  const router = useRouter();
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save");
        return false;
      }
      setMessage("Saved.");
      router.refresh();
      return true;
    } catch {
      setError("Unable to reach the server");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await post("/api/categories", {
      name: catName,
      slug: catSlug,
      description,
      sortOrder: categories.length + 1,
    });
    if (saved) {
      setCatName("");
      setCatSlug("");
      setDescription("");
    }
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await post("/api/menu", {
      name: itemName,
      category,
      description,
      price: Number(price),
      dietaryTags: tags,
      available: true,
      imageUrl: "",
    });
    if (saved) {
      setItemName("");
      setDescription("");
      setPrice("");
      setTags([]);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={addCategory} className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Add category</h2>
          <input value={catName} onChange={(event) => setCatName(event.target.value)} placeholder="Category name" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input value={catSlug} onChange={(event) => setCatSlug(event.target.value)} placeholder="slug e.g. starters" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy} className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Add category</button>
        </form>

        <form onSubmit={addItem} className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Add menu item</h2>
          <input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Item name" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" required className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={(event) =>
                    setTags((current) =>
                      event.target.checked
                        ? [...current, tag]
                        : current.filter((value) => value !== tag),
                    )
                  }
                  className="accent-[#a3421f]"
                />
                {tag}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy || !categories.length} className="rounded-full bg-[#a3421f] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Add item</button>
        </form>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat.id} className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs">
              {cat.name} {!cat.active && "(hidden)"}
              <ActionButton label="×" url={`/api/categories/${cat.id}`} method="DELETE" confirm={`Delete ${cat.name}?`} className="font-bold text-red-700" />
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Menu items ({items.length})</h2>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="text-xs uppercase text-stone-500">
            <tr><th className="py-2">Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 font-medium">{item.name}</td>
                <td className="text-stone-500">{item.categoryName}</td>
                <td>₹{item.price}</td>
                <td>{item.available ? <span className="text-emerald-700">Yes</span> : <span className="text-red-700">No</span>}</td>
                <td className="flex gap-2 py-2">
                  <ActionButton
                    label={item.available ? "Disable" : "Enable"}
                    url={`/api/menu/${item.id}`}
                    method="PATCH"
                    body={{ available: !item.available }}
                  />
                  <ActionButton
                    label="Delete"
                    url={`/api/menu/${item.id}`}
                    method="DELETE"
                    confirm={`Delete ${item.name}?`}
                    className="text-red-700 hover:underline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
