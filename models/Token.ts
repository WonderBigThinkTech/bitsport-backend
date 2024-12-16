import { model, Schema } from "mongoose";
import { IToken } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */
const TokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,
    },
  },
  { timestamps: true }
);

/**
 * IUser Interface Document class inheritance
 */
export default model<IToken>("Token", TokenSchema);
