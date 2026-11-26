import { connectDB } from "@/lib/db";
import { getCategories, getMenuItems } from "@/lib/queries";
import { AdminMenuManager } from "@/components/AdminMenuManager";

export const metadata = { title: "Admin menu" };

export default async function AdminMenuPage() {
  await connectDB();
  const [categories, result] = await Promise.all([
    getCategories(),
    getMenuItems({ limit: 48 }),
  ]);

  return (
    <main>
      <AdminMenuManager categories={categories} items={result.items} />
    </main>
  );
}
