import { model, Schema } from "mongoose";
import { IFarmChallenge } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */

const FarmChallengeSchema = new Schema(
  {
    title: { type: String, required: true },
    difficulty: { type: Number, required: true },
    streak: { type: Number, required: true },
    amount: { type: Number, required: true },
    index: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

/**
 * IFarmChallenge Interface Document class inheritance
 */
export default model<IFarmChallenge>("FarmChallenge", FarmChallengeSchema);
