import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../service/helpers";
import User from "../models/User";
import path from "path";

export const index = async (req: Request, res: Response) => {
  User.find().then((models: any) => {
    res.json({ models });
  });
};

export const names = async (req: Request, res: Response) => {
  User.findById(req.body.userID).then((user: any) => {
    if (user) {
      user.username = req.body.userName;
      user.firstname = req.body.firstName;
      user.lastname = req.body.lastName;

      user.save();
      res.json({
        success: true,
        message: "You submitted successfully.",
        token: generateToken(user),
      })
      return;
    }
  });
};

export const password = (req: Request, res: Response) => {
  User.findById(req.body.userID)
    .then((user: any) => {
      if (user) {
        return bcrypt.compare(req.body.currentPwd, user.password);
      } else {
        throw new Error("User not found");
      }
    })
    .then((isMatch: any) => {
      if (isMatch) {
        return bcrypt.hash(req.body.newPwd, 10); // Hash the new password
      } else {
        throw new Error("Incorrect old password. Please try again.");
      }
    })
    .then((hashedPassword: string) => {
      return User.findByIdAndUpdate(
        req.body.userID,
        { password: hashedPassword },
        { new: true }
      );
    })
    .then((updatedUser: any) => {
      res.json({
        success: true,
        message: "Password updated successfully.",
        token: generateToken(updatedUser),
      });
    })
    .catch((error: any) => {
      res.json({
        success: false,
        message: error.message,
      });
    });
};

export const remove = async (req: Request, res: Response) => {
  User.findByIdAndDelete(req.params.id).then((model: any) => {
    res.json({ success: true, model });
  });
};