import { Types } from "mongoose";
import { z } from "zod";
import {
  DIETARY_TAGS,
  ORDER_STATUSES,
  ORDER_TYPES,
  SLOTS,
  isValidDateString,
  todayString,
} from "@/lib/constants";

export const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid id");

const dateStringSchema = z
  .string()
  .refine(isValidDateString, "Use a valid date in YYYY-MM-DD format");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().max(300).default(""),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  active: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const menuCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  category: objectIdSchema,
  description: z.string().trim().max(500).default(""),
  price: z.number().positive("Price must be greater than zero").max(100000),
  imageUrl: z.union([z.string().url(), z.literal("")]).default(""),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)).default([]),
  available: z.boolean().default(true),
});

export const menuUpdateSchema = menuCreateSchema.partial();

export const specialCreateSchema = z.object({
  date: dateStringSchema,
  item: objectIdSchema,
  specialPrice: z.number().positive("Price must be greater than zero").max(100000),
  note: z.string().trim().max(200).default(""),
  available: z.boolean().default(true),
});

export const specialUpdateSchema = specialCreateSchema.partial();

export const reservationCreateSchema = z.object({
  date: dateStringSchema.refine(
    (value) => value >= todayString(),
    "Reservations must be for today or a future date",
  ),
  time: z.enum(SLOTS, { message: "Choose one of the available time slots" }),
  partySize: z.number().int().min(1, "At least one guest").max(12, "Maximum 12 guests"),
  notes: z.string().trim().max(300).default(""),
});

export const reservationUpdateSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
  notes: z.string().trim().max(300).optional(),
});

export const cartAddSchema = z.object({
  itemId: objectIdSchema,
  qty: z.number().int().min(1).max(50).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: objectIdSchema,
  qty: z.number().int().min(1).max(50),
});

export const checkoutSchema = z
  .object({
    type: z.enum(ORDER_TYPES),
    address: z.string().trim().max(200).default(""),
    tableNumber: z.string().trim().max(20).default(""),
    notes: z.string().trim().max(300).default(""),
  })
  .superRefine((value, ctx) => {
    if (value.type === "delivery" && value.address.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "A delivery address is required",
      });
    }
    if (value.type === "dine-in" && !value.tableNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["tableNumber"],
        message: "A table number is required",
      });
    }
  });

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(["unpaid", "paid"]).optional(),
});

export const reviewCreateSchema = z.object({
  orderId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(800).default(""),
  itemId: objectIdSchema.nullable().optional(),
});

export const favoriteSchema = z.object({ itemId: objectIdSchema });
