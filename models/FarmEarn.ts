import { model, Schema } from "mongoose";
import { IFarmEarn } from "../service/interfaces";

const FarmEarnSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Number,
      required: true,
    },
    tweetType: {
      type: String,
      default: "Farm",
    },
    tweetId: {
      type: String,
      required: true,
    },
    imageLink: {
      type: String,
    },
    mainContent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default model<IFarmEarn>("FarmEarn", FarmEarnSchema);
