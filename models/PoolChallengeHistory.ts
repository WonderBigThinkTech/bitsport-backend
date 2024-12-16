import mongoose, { model, Schema } from "mongoose";
import { IPoolChallengeHistory } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */

const PoolChallengeHistorySchema = new Schema(
  {
    challengeid: {
      type: Schema.Types.ObjectId,
      ref: "PoolChallenge",
    },
    game_userid: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    game_result: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * ICHallenge Interface Document class inheritance
 */
export default model<IPoolChallengeHistory>(
  "poolhistories",
  PoolChallengeHistorySchema
);
