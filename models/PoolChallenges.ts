import { model, Schema } from "mongoose";
import { IPoolChallenge } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */

const PoolChallengeSchema = new Schema(
  {
    create_userid: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    opponent_userid: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status_num: {
      type: Number,
      default: 0,
    },
    coin_type: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    gametype: {
      type: Boolean,
      default: true,
    },
    joinUser: {
      type: Boolean,
      default: false,
    },
    joinOpponent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * ICHallenge Interface Document class inheritance
 */
export default model<IPoolChallenge>("PoolChallenge", PoolChallengeSchema);
