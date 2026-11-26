import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ISpecial {
  _id: Types.ObjectId;
  date: string;
  item: Types.ObjectId;
  specialPrice: number;
  note: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const specialSchema = new Schema<ISpecial>(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    item: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    specialPrice: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", maxlength: 200 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

specialSchema.index({ date: 1, item: 1 }, { unique: true });
specialSchema.index({ date: 1, available: 1 });

export const Special: Model<ISpecial> =
  (models.Special as Model<ISpecial>) ||
  model<ISpecial>("Special", specialSchema);
