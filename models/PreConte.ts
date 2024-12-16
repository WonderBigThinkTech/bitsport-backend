import { Schema, model } from "mongoose";
import { IPreContent } from "../service/interfaces";

const PreContentSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
});

export default model<IPreContent>("PreContent", PreContentSchema);
