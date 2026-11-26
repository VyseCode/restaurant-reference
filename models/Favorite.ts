import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IFavorite {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  item: Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

favoriteSchema.index({ user: 1, item: 1 }, { unique: true });

export const Favorite: Model<IFavorite> =
  (models.Favorite as Model<IFavorite>) ||
  model<IFavorite>("Favorite", favoriteSchema);
