import { Request, Response } from "express";
import TaskSuccess from "../models/TaskSuccess";
import Task from "../models/Task";
import User from "../models/User";

export const adminGetTaskData = async (req: Request, res: Response) => {
  TaskSuccess.find({ taskId: req.body.taskId }).then((models: any) => {
    res.json({ models });
  });
};

const giveReward = (taskId: string, userId: string) => {
  let amount: number;
  let unit: string;

  Task.findOne({ _id: taskId }).then(async (model1: any) => {
    amount = model1.reward;
    unit = model1.unit;
    User.findOne({ username: userId }).then(async (model2: any) => {
      if (unit == "busd") model2.money.busd += amount;
      else if (unit == "cake") model2.money.cake += amount;
      else if (unit == "usdt") model2.money.usdt += amount;
      else if (unit == "bitp") model2.money.bitp += amount;
      model2.save();
    });
  });
};

export const adminUpdateTaskStatus = async (req: Request, res: Response) => {
  TaskSuccess.findOne({
    _id: req.body.taskSuccessId,
  }).then(async (model: any) => {
    if (!model) res.json({ success: false, message: "Error" });
    model.taskStatus = req.body.taskStatus;
    model.statusNote = req.body.statusNote;
    if (model.taskStatus == 1) {
      model.getReward = true;
      giveReward(model.taskId, model.userId);
    }
    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const userGetTaskData = async (req: Request, res: Response) => {
  TaskSuccess.find({
    userId: req.body.userId,
  }).then(async (models: any) => {
    if (!models) res.json({ success: false, message: "nothing is reported" });
    res.json({ success: true, models });
  });
};

export const userReportTask = async (req: Request, res: Response) => {
  TaskSuccess.findOne({
    taskId: req.body.taskId,
    userId: req.body.userId,
  }).then(async (model: any) => {
    if (!model) {
      let length = 0;
      await TaskSuccess.find()
        .countDocuments()
        .then((data: any) => (length = data));

      model = new TaskSuccess();
      model.index = length + 1;
    }

    model.taskId = req.body.taskId;
    model.userId = req.body.userId;
    model.reportDate = req.body.reportDate;
    model.reportDesc = req.body.reportDesc;
    model.reportLink = req.body.reportLink;
    model.taskStatus = 0;
    model.statusNote = "";
    model.getReward = false;

    model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};
