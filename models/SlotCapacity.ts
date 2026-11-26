import { Schema, model, models, type Model } from "mongoose";

export interface ISlotCapacity {
  _id: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
}

const slotCapacitySchema = new Schema<ISlotCapacity>(
  {
    _id: { type: String, required: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: { type: String, required: true },
    capacity: { type: Number, required: true, min: 0, max: 1000 },
    booked: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

slotCapacitySchema.index({ date: 1 });

export const SlotCapacity: Model<ISlotCapacity> =
  (models.SlotCapacity as Model<ISlotCapacity>) ||
  model<ISlotCapacity>("SlotCapacity", slotCapacitySchema);
