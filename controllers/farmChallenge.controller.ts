import { Request, Response } from "express";
import FarmChallenge from "../models/FarmChallenge";
import PlayedChallenges from "../models/PlayedChallenges";
import PlayChallenges from "../models/PlayChallenges";

export const index = async (req: Request, res: Response) => {
  FarmChallenge.find().then((models: any) => {
    res.json({ models });
  });
};

export const save = async (req: Request, res: Response) => {
  FarmChallenge.findOne({
    title: req.body.title,
    difficulty: req.body.difficulty,
    streak: req.body.streak,
    amount: req.body.amount,
  }).then(async (model: any) => {
    if (model)
      res.json({ success: false, message: "The farmChallenge exits!" });

    let length = 0;
    await FarmChallenge.find()
      .countDocuments()
      .then((data: any) => (length = data));

    model = new FarmChallenge();
    model.title = req.body.title;
    model.difficulty = req.body.difficulty;
    model.streak = req.body.streak;
    model.amount = req.body.amount;
    model.index = length + 1;
    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const remove = async (req: Request, res: Response) => {
  FarmChallenge.findByIdAndDelete(req.params.id).then((model: any) => {
    res.json({ success: true, model });
  });
};
