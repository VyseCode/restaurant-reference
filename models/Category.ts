import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, default: "", maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ active: 1, sortOrder: 1 });

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) ||
  model<ICategory>("Category", categorySchema);
