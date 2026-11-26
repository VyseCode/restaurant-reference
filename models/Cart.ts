import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICartItem {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  qty: number;
}

export interface ICart {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    qty: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart: Model<ICart> =
  (models.Cart as Model<ICart>) || model<ICart>("Cart", cartSchema);
