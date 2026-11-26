import { connectDB } from "@/lib/db";
import { getReservations } from "@/lib/queries";
import { ActionButton } from "@/components/ActionButton";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Admin reservations" };

export default async function AdminReservationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const date = Array.isArray(params.date) ? params.date[0] : params.date;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  await connectDB();
  const result = await getReservations({ date: date || undefined, status: status || undefined, limit: 48 });

  return (
    <main className="space-y-4">
      <form action="/admin/reservations" method="get" className="flex flex-wrap items-center gap-2">
        <input type="date" name="date" defaultValue={date ?? ""} aria-label="Date" className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white">Apply</button>
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
          No reservations match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {result.items.map((reservation) => (
            <article key={reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {reservation.date} at {reservation.time} · {reservation.partySize} guests
                </p>
                <p className="text-xs text-stone-500">
                  {reservation.userName ?? "Guest"} · <span className="capitalize">{reservation.status}</span>
                  {reservation.notes ? ` · ${reservation.notes}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {reservation.status !== "confirmed" && (
                  <ActionButton label="Confirm" url={`/api/reservations/${reservation.id}`} method="PATCH" body={{ status: "confirmed" }} />
                )}
                {reservation.status !== "completed" && (
                  <ActionButton label="Complete" url={`/api/reservations/${reservation.id}`} method="PATCH" body={{ status: "completed" }} />
                )}
                {reservation.status !== "cancelled" && (
                  <ActionButton label="Cancel" url={`/api/reservations/${reservation.id}`} method="PATCH" body={{ status: "cancelled" }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" />
                )}
                <ActionButton label="Delete" url={`/api/reservations/${reservation.id}`} method="DELETE" confirm="Delete this booking?" className="text-xs text-stone-500 hover:underline" />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
