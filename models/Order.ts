import { Schema, model, models, type Model, type Types } from "mongoose";

export type OrderType = "dine-in" | "takeaway" | "delivery";
export type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export interface IOrderItem {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: IOrderItem[];
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  address: string;
  tableNumber: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    type: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      required: true,
    },
    status: {
      type: String,
      enum: ["placed", "preparing", "ready", "completed", "cancelled"],
      default: "placed",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    total: { type: Number, required: true, min: 0 },
    address: { type: String, default: "" },
    tableNumber: { type: String, default: "" },
    notes: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);
