import { Schema, model, models, type Model, type Types } from "mongoose";

export type ReservationStatus = "confirmed" | "cancelled" | "completed";

export interface IReservation {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 12 },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
      index: true,
    },
    notes: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

reservationSchema.index(
  { user: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } },
);
reservationSchema.index({ date: 1, time: 1, status: 1 });

export const Reservation: Model<IReservation> =
  (models.Reservation as Model<IReservation>) ||
  model<IReservation>("Reservation", reservationSchema);
