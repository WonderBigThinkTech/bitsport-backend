import { model, Schema } from "mongoose";
import mongoose from "mongoose";
import { IDHistory } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */

const Deposit_historySchema = new Schema(
  {
    userId: { type: String, required: true },
    coin: { type: String, required: true },
    amount: { type: Number, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    index: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

/**
 * IDHistory Interface Document class inheritance
 */
export default model<IDHistory>("deposit_history", Deposit_historySchema);
