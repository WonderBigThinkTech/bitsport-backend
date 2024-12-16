import { Schema, model } from "mongoose";
import { RefreshTime } from "../service/interfaces";

const RefreshTimeSchema = new Schema({
  time: {
    type: Number,
    required: true,
  },
});

export default model<RefreshTime>("RefreshTime", RefreshTimeSchema);
