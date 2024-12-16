import { model, Schema } from "mongoose";
import { ITask } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */
const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    reward: { type: Number, required: true },
    unit: { type: String, required: true },
    status: { type: Boolean, required: true, default: true },
    shared: { type: Boolean, required: true, default: true },
    index: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

/**
 * IUser Interface Document class inheritance
 */
export default model<ITask>("Task", TaskSchema);
