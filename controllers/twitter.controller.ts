import { Request, Response } from "express";
import FarmEarn from "../models/FarmEarn";

export const addFarmEarnTweet = async (req: Request, res: Response) => {
  console.log("req.body", req.body);
  const { content, endTime, tweetType, tweetId, imageLink } = req.body;
  const startTime = Date.now();

  if (endTime <= startTime) {
    return res.status(400).json("Incorrect expire time");
  }

  if (tweetType !== "Farm" && tweetType !== "Booster") {
    return res.status(400).json("Invalid tweet type");
  }

  try {
    // const farmEarn = await FarmEarn.findOne({
    //   endTime: { $gt: startTime },
    // });
    // if (farmEarn) {
    //   return res.status(400).json("There is already tweet for this season");
    // }

    const newFarm = await new FarmEarn({
      content,
      startTime,
      endTime,
      tweetType,
      tweetId,
      imageLink,
    }).save();
    return res.json(newFarm);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};

export const getFarmEarn = async (req: Request, res: Response) => {
  const farmEarn = await FarmEarn.find({});
  return res.json(farmEarn);
};

export const getCurrentEarn = async (req: Request, res: Response) => {
  const farmEarn = await FarmEarn.find({
    startTime: { $lt: Date.now() },
    endTime: { $gt: Date.now() },
  });
  return res.json(farmEarn);
};

export const delFarmEarn = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const result = await FarmEarn.findByIdAndDelete(id);
    return res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};

export const updateFarmEarn = async (req: Request, res: Response) => {
  const { id, content, endTime, tweetType } = req.body;

  try {
    const result = await FarmEarn.findByIdAndUpdate(
      id,
      {
        content: content,
        endTime: endTime,
        tweetType: tweetType,
      },
      { new: true }
    );
    return res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
};
