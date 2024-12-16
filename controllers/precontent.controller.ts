import { Request, Response } from "express";
import PreConte from "../models/PreConte";

export const getContent = async (req: Request, res: Response) => {
  try {
    const result = await PreConte.find({});
    return res.json(result);
  } catch (e) {
    console.error(e);
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const count = await PreConte.find({});
    if (count.length) {
      const result = await PreConte.findByIdAndUpdate(count[0]._id, {
        content: content,
      });
    } else {
        const result = await PreConte.findOneAndUpdate(
          { content: content },
          { content: content },
          { upsert: true }
        );
    }
    return res.json({status: 'success'});
  } catch (e) {
    console.error(e);
  }
};
