import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getReservations, getSlotAvailability } from "@/lib/queries";
import { addDays, isValidDateString } from "@/lib/constants";
import { ReservationForm } from "@/components/ReservationForm";
import { ActionButton } from "@/components/ActionButton";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Reservations" };

export default async function ReservationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const requested = Array.isArray(params.date) ? params.date[0] : params.date;
  const date = requested && isValidDateString(requested) ? requested : addDays(1);
  const session = await getSession();
  await connectDB();

  const [availability, reservations] = await Promise.all([
    getSlotAvailability(date),
    getReservations({ userId: session?.userId ?? "", date, limit: 50 }),
  ]);
  const booked = reservations.items
    .filter((item) => item.status === "confirmed")
    .map((item) => item.time);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">Reserve a table</h1>
        <p className="text-sm text-stone-500">
          Pick a date and time. Slots fill up quickly — each has limited capacity.
        </p>
      </div>

      <ReservationForm date={date} availability={availability} booked={booked} />

      <section>
        <h2 className="mb-3 text-xl font-semibold">Your bookings on {date}</h2>
        {reservations.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
            No bookings for this date yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reservations.items.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4">
                <div>
                  <p className="font-medium text-stone-900">
                    {item.time} · {item.partySize} guest{item.partySize === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-stone-500">
                    <span className={`font-semibold ${item.status === "confirmed" ? "text-emerald-700" : item.status === "cancelled" ? "text-red-700" : "text-stone-600"}`}>
                      {item.status}
                    </span>
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
                {item.status === "confirmed" && (
                  <ActionButton
                    label="Cancel booking"
                    url={`/api/reservations/${item.id}`}
                    method="PATCH"
                    body={{ status: "cancelled" }}
                    confirm="Cancel this reservation?"
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
