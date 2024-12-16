import { Request, Response } from "express";
import Bug from "../models/BugReport";

export const getAll = async (req: Request, res: Response) => {
  Bug.find().then((models: any) => {
    res.json({ models });
  });
};

export const create = async (req: Request, res: Response) => {
  Bug.findOne({
    BugTitle: req.body.BugTitle,
    BugDescription: req.body.BugDescription,
    BugReportLink: req.body.BugReportLink,
    ReporterId: req.body.userId,
  }).then(async (model: any) => {
    if (model) res.json({ success: false, message: "The BugReport exits!" });

    let length = 0;
    await Bug.find()
      .countDocuments()
      .then((data: any) => (length = data));

    model = new Bug();
    model.BugTitle = req.body.BugTitle;
    model.BugDescription = req.body.BugDescription;
    model.BugReportLink = req.body.BugReportLink;
    model.ReporterId = req.body.userId;
    model.status = 0;
    model.ReportReply = "";
    model.index = length + 1;
    await model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const edit = async (req: Request, res: Response) => {
  Bug.findOne({
    _id: req.body.bugId,
  }).then(async (model: any) => {
    if (!model)
      res.json({ success: false, message: "The BugReport not exits!" });

    model.status = req.body.status;
    model.ReportReply = req.body.reportReply;
    await model.save().then(() => {
      res.json({ success: true, model });
    });
  });
};

export const getByUserId = async (req: Request, res: Response) => {
  Bug.find({
    ReporterId: req.body.userId,
  }).then(async (model: any) => {
    res.json({ success: true, model });
  });
};

export const remove = async (req: Request, res: Response) => {
  Bug.findByIdAndDelete(req.body.bugId).then((model: any) => {
    res.json({ success: true, model });
  });
};
