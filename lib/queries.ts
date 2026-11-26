import { Types } from "mongoose";
import { Category } from "@/models/Category";
import { MenuItem } from "@/models/MenuItem";
import { Special } from "@/models/Special";
import { Cart } from "@/models/Cart";
import { Reservation } from "@/models/Reservation";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { Favorite } from "@/models/Favorite";
import type {
  AdminStatsDTO,
  CartDTO,
  CategoryDTO,
  MenuItemDTO,
  MenuListDTO,
  OrderDTO,
  PaginationDTO,
  ReservationDTO,
  ReviewDTO,
  SpecialDTO,
} from "@/lib/types";

type LeanCategory = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

type LeanMenuItem = {
  _id: Types.ObjectId;
  name: string;
  category: LeanCategory | Types.ObjectId | null;
  description: string;
  price: number;
  imageUrl: string;
  dietaryTags: string[];
  available: boolean;
  popularity: number;
};

type RatingStat = { _id: Types.ObjectId; avg: number; count: number };

function validId(value: string | null | undefined) {
  return !!value && Types.ObjectId.isValid(value);
}

function pagination(total: number, page: number, limit: number): PaginationDTO {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function statsFor(ids: Types.ObjectId[]) {
  if (!ids.length) return new Map<string, RatingStat>();
  const stats = (await Review.aggregate([
    { $match: { item: { $in: ids } } },
    { $group: { _id: "$item", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ])) as RatingStat[];
  return new Map(stats.map((stat) => [stat._id.toString(), stat]));
}

async function favoriteIds(viewerId: string, ids: Types.ObjectId[]) {
  if (!validId(viewerId) || !ids.length) return new Set<string>();
  const docs = await Favorite.find({ user: viewerId, item: { $in: ids } })
    .select("item")
    .lean();
  return new Set(docs.map((doc) => doc.item.toString()));
}

function toMenuItem(
  doc: LeanMenuItem,
  ratings: Map<string, RatingStat>,
  favorites: Set<string>,
): MenuItemDTO {
  const id = doc._id.toString();
  const stat = ratings.get(id);
  const category =
    doc.category && "name" in doc.category
      ? (doc.category as LeanCategory)
      : null;
  return {
    id,
    name: doc.name,
    categoryId: category?._id.toString() ?? "",
    categoryName: category?.name ?? "Uncategorized",
    description: doc.description ?? "",
    price: doc.price,
    imageUrl: doc.imageUrl ?? "",
    dietaryTags: doc.dietaryTags ?? [],
    available: doc.available,
    popularity: doc.popularity ?? 0,
    rating: stat ? Math.round(stat.avg * 10) / 10 : 0,
    reviewCount: stat?.count ?? 0,
    isFavorite: favorites.has(id),
  };
}

export async function getCategories(activeOnly = false): Promise<CategoryDTO[]> {
  const docs = (await Category.find(activeOnly ? { active: true } : {})
    .sort({ sortOrder: 1, name: 1 })
    .lean()) as unknown as LeanCategory[];
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    sortOrder: doc.sortOrder ?? 0,
    active: doc.active,
  }));
}

export async function getMenuItems(
  options: {
    q?: string;
    category?: string;
    diet?: string;
    available?: string;
    sort?: string;
    page?: number;
    limit?: number;
    viewerId?: string;
  } = {},
): Promise<MenuListDTO> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const filter: Record<string, unknown> = {};

  const term = (options.q ?? "").trim();
  if (term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(escaped, "i") },
      { description: new RegExp(escaped, "i") },
      { dietaryTags: new RegExp(escaped, "i") },
    ];
  }
  if (validId(options.category)) {
    filter.category = new Types.ObjectId(options.category);
  }
  if (options.diet) filter.dietaryTags = options.diet;
  if (options.available === "true") filter.available = true;
  if (options.available === "false") filter.available = false;

  const sort: Record<string, 1 | -1> =
    options.sort === "price-asc"
      ? { price: 1 }
      : options.sort === "price-desc"
        ? { price: -1 }
        : options.sort === "popular"
          ? { popularity: -1, name: 1 }
          : options.sort === "name"
            ? { name: 1 }
            : { createdAt: -1 };

  const [docs, total] = await Promise.all([
    MenuItem.find(filter)
      .populate("category", "name")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MenuItem.countDocuments(filter),
  ]);
  const items = docs as unknown as LeanMenuItem[];
  const ids = items.map((item) => item._id);
  const [ratings, favorites] = await Promise.all([
    statsFor(ids),
    favoriteIds(options.viewerId ?? "", ids),
  ]);

  return {
    items: items.map((item) => toMenuItem(item, ratings, favorites)),
    pagination: pagination(total, page, limit),
  };
}

export async function getMenuItem(
  id: string,
  viewerId = "",
): Promise<MenuItemDTO | null> {
  if (!validId(id)) return null;
  const doc = (await MenuItem.findById(id)
    .populate("category", "name")
    .lean()) as unknown as LeanMenuItem | null;
  if (!doc) return null;

  const [ratings, favorites] = await Promise.all([
    statsFor([doc._id]),
    favoriteIds(viewerId, [doc._id]),
  ]);
  return toMenuItem(doc, ratings, favorites);
}

export async function getSpecials(date?: string): Promise<SpecialDTO[]> {
  const filter: Record<string, unknown> = { available: true };
  if (date) filter.date = date;
  const docs = (await Special.find(filter)
    .populate("item", "name price")
    .sort({ date: 1 })
    .limit(50)
    .lean()) as unknown as Array<{
    _id: Types.ObjectId;
    date: string;
    item: { _id: Types.ObjectId; name: string; price: number } | null;
    specialPrice: number;
    note: string;
    available: boolean;
  }>;

  return docs
    .filter((doc) => doc.item)
    .map((doc) => ({
      id: doc._id.toString(),
      date: doc.date,
      itemId: doc.item!._id.toString(),
      itemName: doc.item!.name,
      price: doc.specialPrice,
      regularPrice: doc.item!.price,
      note: doc.note ?? "",
      available: doc.available,
    }));
}

type LeanCart = {
  items: Array<{
    _id: Types.ObjectId;
    item: { _id: Types.ObjectId; name: string; price: number; available: boolean } | null;
    qty: number;
  }>;
};

export async function getCart(userId: string): Promise<CartDTO> {
  const doc = (await Cart.findOne({ user: userId })
    .populate("items.item", "name price available")
    .lean()) as unknown as LeanCart | null;

  const items = (doc?.items ?? [])
    .filter((line) => line.item)
    .map((line) => ({
      itemId: line.item!._id.toString(),
      name: line.item!.name,
      price: line.item!.price,
      qty: line.qty,
      lineTotal: line.item!.price * line.qty,
      available: line.item!.available,
    }));
  return {
    items,
    total: items.reduce((sum, line) => sum + line.lineTotal, 0),
    count: items.reduce((sum, line) => sum + line.qty, 0),
  };
}

export async function getReservations(options: {
  userId?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ReservationDTO[]; pagination: PaginationDTO }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const filter: Record<string, unknown> = {};
  if (validId(options.userId)) filter.user = new Types.ObjectId(options.userId);
  if (options.date) filter.date = options.date;
  if (options.status) filter.status = options.status;

  const [docs, total] = await Promise.all([
    Reservation.find(filter)
      .populate("user", "name")
      .sort({ date: -1, time: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Reservation.countDocuments(filter),
  ]);
  const items = docs as unknown as Array<{
    _id: Types.ObjectId;
    date: string;
    time: string;
    partySize: number;
    status: string;
    notes: string;
    user: { name: string } | null;
  }>;

  return {
    items: items.map((doc) => ({
      id: doc._id.toString(),
      date: doc.date,
      time: doc.time,
      partySize: doc.partySize,
      status: doc.status,
      notes: doc.notes ?? "",
      userName: doc.user?.name,
    })),
    pagination: pagination(total, page, limit),
  };
}

export async function getOrders(options: {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: OrderDTO[]; pagination: PaginationDTO }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const filter: Record<string, unknown> = {};
  if (validId(options.userId)) filter.user = new Types.ObjectId(options.userId);
  if (options.status) filter.status = options.status;

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  const orderIds = docs.map((doc) => doc._id);
  const reviewed = await Review.find({ order: { $in: orderIds } })
    .select("order")
    .lean();
  const reviewedIds = new Set(reviewed.map((doc) => doc.order.toString()));
  const orders = docs as unknown as Array<{
    _id: Types.ObjectId;
    items: Array<{
      item: Types.ObjectId;
      name: string;
      price: number;
      qty: number;
    }>;
    type: string;
    status: string;
    paymentStatus: string;
    total: number;
    address: string;
    tableNumber: string;
    notes: string;
    createdAt: Date;
    user: { name: string } | null;
  }>;

  return {
    items: orders.map((doc) => ({
      id: doc._id.toString(),
      items: doc.items.map((line) => ({
        itemId: line.item.toString(),
        name: line.name,
        price: line.price,
        qty: line.qty,
      })),
      type: doc.type,
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      total: doc.total,
      address: doc.address ?? "",
      tableNumber: doc.tableNumber ?? "",
      notes: doc.notes ?? "",
      createdAt: doc.createdAt.toISOString(),
      userName: doc.user?.name,
      reviewed: reviewedIds.has(doc._id.toString()),
    })),
    pagination: pagination(total, page, limit),
  };
}

export async function getReviews(options: {
  itemId?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ReviewDTO[]; pagination: PaginationDTO }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const filter: Record<string, unknown> = {};
  if (validId(options.itemId)) filter.item = new Types.ObjectId(options.itemId);

  const [docs, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  const reviews = docs as unknown as Array<{
    _id: Types.ObjectId;
    order: Types.ObjectId;
    item: Types.ObjectId | null;
    user: { name: string } | null;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;

  return {
    items: reviews.map((doc) => ({
      id: doc._id.toString(),
      orderId: doc.order.toString(),
      itemId: doc.item?.toString() ?? "",
      userName: doc.user?.name ?? "Guest",
      rating: doc.rating,
      comment: doc.comment ?? "",
      createdAt: doc.createdAt.toISOString(),
    })),
    pagination: pagination(total, page, limit),
  };
}

export async function getFavoriteItems(userId: string): Promise<MenuItemDTO[]> {
  if (!validId(userId)) return [];
  const favs = await Favorite.find({ user: userId })
    .select("item")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const ids = favs.map((doc) => doc.item);
  if (!ids.length) return [];
  const docs = (await MenuItem.find({ _id: { $in: ids } })
    .populate("category", "name")
    .lean()) as unknown as LeanMenuItem[];
  const [ratings, favorites] = await Promise.all([
    statsFor(docs.map((doc) => doc._id)),
    favoriteIds(userId, docs.map((doc) => doc._id)),
  ]);
  return docs.map((doc) => toMenuItem(doc, ratings, favorites));
}

export async function getAdminStats(): Promise<AdminStatsDTO> {
  const [orderStats, revenueRows, reservationCount, statusRows, popularRows] =
    await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Reservation.countDocuments({ status: "confirmed" }),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.item",
            orders: { $sum: "$items.qty" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const itemIds = popularRows.map((row: { _id: Types.ObjectId }) => row._id);
  const names = await MenuItem.find({ _id: { $in: itemIds } })
    .select("name")
    .lean();

  const statusCounts: Record<string, number> = {};
  for (const row of statusRows as Array<{ _id: string; count: number }>) {
    statusCounts[row._id] = row.count;
  }

  return {
    orders: orderStats,
    revenue: (revenueRows[0] as { total?: number } | undefined)?.total ?? 0,
    reservations: reservationCount,
    statusCounts,
    popularItems: (popularRows as Array<{
      _id: Types.ObjectId;
      orders: number;
    }>).map((row) => ({
      id: row._id.toString(),
      name:
        names.find((doc) => doc._id.toString() === row._id.toString())?.name ??
        "Unknown item",
      orders: row.orders,
    })),
  };
}
