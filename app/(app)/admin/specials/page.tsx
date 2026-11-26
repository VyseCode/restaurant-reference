import { connectDB } from "@/lib/db";
import { getAllSpecials, getMenuItems } from "@/lib/queries";
import { todayString } from "@/lib/constants";
import { SpecialManager } from "@/components/SpecialManager";

export const metadata = { title: "Admin specials" };

export default async function AdminSpecialsPage() {
  await connectDB();
  const [result, specials] = await Promise.all([
    getMenuItems({ limit: 48 }),
    getAllSpecials(),
  ]);

  return (
    <main>
      <SpecialManager items={result.items} specials={specials} today={todayString()} />
    </main>
  );
}
