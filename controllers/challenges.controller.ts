import { Request, Response } from "express";
import Challenge from "../models/Challenge";
import PlayedChallenges from "../models/PlayedChallenges";
import PlayChallenges from "../models/PlayChallenges";

export const index = async (req: Request, res: Response) => {
  Challenge.find().then((models: any) => {
    res.json({ models });
  });
};

const getCurrentMatch = async (challenge_id, userId) => {
  return PlayChallenges.findOne({
    user_id: userId,
    challenge_id: challenge_id,
    isFinished: false,
  }).then((model: any) => {
    let current_match = 0;
    if (model) current_match = model.current_match;
    return current_match;
  });
};

export const searchByUser = async (req: Request, res: Response) => {
  PlayChallenges.find({
    user_id: req.body.userId,
    isFinished: true,
  }).then((models: any) => {
    const data = models.map((item) => {
      return item.challenge_id;
    });
    Challenge.find().then(async (challenge_models: any) => {
      const filteredData = challenge_models.filter((item) => {
        return !data.includes(item.index);
      });
      let newData: any = [];
      for (let index = 0; index < filteredData.length; index++) {
        const element = filteredData[index];
        let current_match = await getCurrentMatch(
          element.index,
          req.body.userId
        );
        newData.push({ challenge_id: element.index, current_match });
      }
      res.json({ data: { filteredData, newData } });
    });
  });
};

export const save = async (req: Request, res: Response) => {
  Challenge.findOne({
    title: req.body.title,
    qc: req.body.qc,
    difficulty: req.body.difficulty,
    streak: req.body.streak,
    amount: req.body.amount,
    number_of_players: req.body.number_of_players,
  }).then(async (model: any) => {
    if (model) res.json({ success: false, message: "The challenge exits!" });

    let length = 0;
    await Challenge.find()
      .countDocuments()
      .then((data: any) => (length = data));

    model = new Challenge();
    model.title = req.body.title;
    model.difficulty = req.body.difficulty;
    model.qc = req.body.qc;
    model.streak = req.body.streak;
    model.amount = req.body.amount;
    model.coin_sku = req.body.cointype;
    model.number_of_players = req.body.number_of_players;
    model.played_number_count = 0;
    model.index = length + 1;
    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const remove = async (req: Request, res: Response) => {
  Challenge.findByIdAndDelete(req.params.id).then((model: any) => {
    res.json({ success: true, model });
  });
};
