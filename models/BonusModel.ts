import { Schema, model } from "mongoose";
import { IBonus } from "../service/interfaces";

const BonusModelSchema = new Schema({
  matrix: {
    type: [[Number]],
    required: true,
  },
});

export default model<IBonus>("BonusModel", BonusModelSchema);
