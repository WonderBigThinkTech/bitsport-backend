import { Request, Response } from "express";
import Task from "../models/Task";

export const getAll = async (req: Request, res: Response) => {
  Task.find().then((models: any) => {
    res.json({ models });
  });
};

export const create = async (req: Request, res: Response) => {
  Task.findOne({
    title: req.body.title,
    description: req.body.description,
    reward: req.body.reward,
    unit: req.body.unit,
    status: req.body.status,
    shared: req.body.shared,
  }).then(async (model: any) => {
    if (model) res.json({ success: false, message: "The Task exits!" });

    let length = 0;
    await Task.find()
      .countDocuments()
      .then((data: any) => (length = data));

    model = new Task();
    model.title = req.body.title;
    model.description = req.body.description;
    model.reward = req.body.reward;
    model.unit = req.body.unit;
    model.status = req.body.status;
    model.shared = req.body.shared;
    model.index = length + 1;
    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const remove = async (req: Request, res: Response) => {
  Task.findByIdAndDelete(req.body.taskId).then((model: any) => {
    res.json({ success: true, model });
  });
};

export const edit = async (req: Request, res: Response) => {
  Task.findOne({
    _id: req.body.taskId,
  }).then(async (model: any) => {
    if (!model) res.json({ success: false, message: "The Task not exits!" });

    model.title = req.body.title;
    model.description = req.body.description;
    model.reward = req.body.reward;
    model.unit = req.body.unit;
    model.status = req.body.status;
    model.shared = req.body.shared;
    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};
