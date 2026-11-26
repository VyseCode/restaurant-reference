import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
  item: Types.ObjectId | null;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    item: { type: Schema.Types.ObjectId, ref: "MenuItem", default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 800 },
  },
  { timestamps: true },
);

reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ item: 1, createdAt: -1 });

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);
