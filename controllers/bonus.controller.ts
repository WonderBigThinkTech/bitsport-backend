import { Request, Response } from "express";
import BonusModel from "../models/BonusModel";

export const getBonus = async (req: Request, res: Response) => {
  try {
    const result = await BonusModel.find({});
    return res.json(result);
  } catch (e) {
    console.error('Get Bonus Error\n--------------------------\n', e);
  }
};

export const saveBonus = async (req: Request, res: Response) => {
  try {
    const {matrix} = req.body;
    const count = await BonusModel.find({});

    if (count.length) {
      const result = await BonusModel.findByIdAndUpdate(count[0]._id, {
        matrix: matrix,
      });
    } else {
        const result = await BonusModel.findOneAndUpdate(
          { matrix: matrix },
          { matrix: matrix },
          { upsert: true }
        );
    }
    return res.json({status: 'success'});
  } catch (e) {
    console.error('Save Bonus Error\n---------------------------\n', e);
  }
};
