import { Reservation } from "@/models/Reservation";
import { SlotCapacity } from "@/models/SlotCapacity";
import { SLOT_CAPACITY, SLOTS } from "@/lib/constants";
import type { SlotCapacityDTO } from "@/lib/types";

export function slotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function ensureSlot(date: string, time: string): Promise<void> {
  const key = slotKey(date, time);
  if (await SlotCapacity.exists({ _id: key })) return;

  const count = await Reservation.countDocuments({
    date,
    time,
    status: "confirmed",
  });
  try {
    await SlotCapacity.updateOne(
      { _id: key },
      {
        $setOnInsert: {
          date,
          time,
          capacity: SLOT_CAPACITY,
          booked: Math.min(count, SLOT_CAPACITY),
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
}

export async function claimSlot(date: string, time: string): Promise<boolean> {
  await ensureSlot(date, time);
  const claimed = await SlotCapacity.findOneAndUpdate(
    { _id: slotKey(date, time), $expr: { $lt: ["$booked", "$capacity"] } },
    { $inc: { booked: 1 } },
    { new: true },
  );
  return claimed !== null;
}

export async function releaseSlot(date: string, time: string): Promise<boolean> {
  const released = await SlotCapacity.findOneAndUpdate(
    { _id: slotKey(date, time), booked: { $gt: 0 } },
    { $inc: { booked: -1 } },
    { new: true },
  );
  return released !== null;
}

export async function setSlotCapacity(
  date: string,
  time: string,
  capacity: number,
): Promise<SlotCapacityDTO> {
  const key = slotKey(date, time);
  let doc;
  try {
    doc = await SlotCapacity.findOneAndUpdate(
      { _id: key },
      {
        $set: { capacity },
        $setOnInsert: { date, time, booked: 0 },
      },
      { new: true, upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    doc = await SlotCapacity.findById(key);
  }
  if (!doc) throw new Error("Could not update slot capacity");
  return toSlotDTO(doc);
}

export async function getSlotCapacities(date: string): Promise<SlotCapacityDTO[]> {
  const docs = await SlotCapacity.find({ date }).lean();
  const byTime = new Map(docs.map((doc) => [doc.time, doc]));
  return SLOTS.map((time) => {
    const doc = byTime.get(time);
    const capacity = doc?.capacity ?? SLOT_CAPACITY;
    const booked = doc?.booked ?? 0;
    return {
      time,
      capacity,
      booked,
      remaining: Math.max(0, capacity - booked),
    };
  });
}

function toSlotDTO(doc: {
  time: string;
  capacity: number;
  booked: number;
}): SlotCapacityDTO {
  return {
    time: doc.time,
    capacity: doc.capacity,
    booked: doc.booked,
    remaining: Math.max(0, doc.capacity - doc.booked),
  };
}
