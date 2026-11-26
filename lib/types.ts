export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  avatarUrl: string;
};

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

export type MenuItemDTO = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryTags: string[];
  available: boolean;
  popularity: number;
  rating: number;
  reviewCount: number;
  isFavorite: boolean;
};

export type SpecialDTO = {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  price: number;
  regularPrice: number;
  note: string;
  available: boolean;
};

export type CartLineDTO = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
  available: boolean;
};

export type CartDTO = {
  items: CartLineDTO[];
  total: number;
  count: number;
};

export type ReservationDTO = {
  id: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  notes: string;
  userName?: string;
};

export type OrderLineDTO = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderDTO = {
  id: string;
  items: OrderLineDTO[];
  type: string;
  status: string;
  paymentStatus: string;
  total: number;
  address: string;
  tableNumber: string;
  notes: string;
  createdAt: string;
  userName?: string;
  reviewed?: boolean;
};

export type ReviewDTO = {
  id: string;
  orderId: string;
  itemId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type MenuListDTO = {
  items: MenuItemDTO[];
  pagination: PaginationDTO;
};

export type AdminStatsDTO = {
  orders: number;
  revenue: number;
  reservations: number;
  popularItems: Array<{ id: string; name: string; orders: number }>;
  statusCounts: Record<string, number>;
};
