import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IMenuItem {
  _id: Types.ObjectId;
  name: string;
  category: Types.ObjectId;
  description: string;
  price: number;
  imageUrl: string;
  dietaryTags: string[];
  available: boolean;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    description: { type: String, default: "", maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    dietaryTags: {
      type: [String],
      default: [],
      enum: ["vegetarian", "vegan", "gluten-free", "halal", "spicy"],
    },
    available: { type: Boolean, default: true },
    popularity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ name: "text", description: "text", dietaryTags: "text" });
menuItemSchema.index({ popularity: -1 });

export const MenuItem: Model<IMenuItem> =
  (models.MenuItem as Model<IMenuItem>) ||
  model<IMenuItem>("MenuItem", menuItemSchema);
