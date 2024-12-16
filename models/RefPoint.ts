import { Schema, model } from "mongoose";
import { RefPoint } from "../service/interfaces";

const RefPoint = new Schema({
  point: {
    type: Number,
    required: true,
  },
});

export default model<RefPoint>("RefPoint", RefPoint);
