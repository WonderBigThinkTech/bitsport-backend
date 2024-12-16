import { model, Schema } from "mongoose";
import { IBugReport } from "../service/interfaces";

/**
 * Create a new Schema from mongoose
 */
const BugSchema = new Schema(
  {
    BugTitle: { type: String, required: true },
    BugDescription: { type: String, required: true },
    BugReportLink: { type: String },
    status: { type: Number, required: true, default: 0 }, // 0: pending, 1: Accepted, 2: Denied, 3: Fixed
    ReporterId: { type: String, required: true },
    ReportReply: { type: String },
    index: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

/**
 * IUser Interface Document class inheritance
 */
export default model<IBugReport>("Bug", BugSchema);
