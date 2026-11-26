export const SLOTS = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;

export const SLOT_CAPACITY = 2;

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "halal",
  "spicy",
] as const;

export const ORDER_TYPES = ["dine-in", "takeaway", "delivery"] as const;

export const ORDER_STATUSES = [
  "placed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export const NEXT_ORDER_STATUS: Record<string, string | null> = {
  placed: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isBookableSlot(date: string, time: string): boolean {
  if (!isValidDateString(date)) return false;
  const today = todayString();
  if (date < today) return false;
  if (date === today && time <= nowTimeString()) return false;
  return true;
}

export function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
