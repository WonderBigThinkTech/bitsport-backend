import { Request, Response, Router } from "express";
import { generateToken } from "../service/helpers";
import User from "../models/User";
import { Multer } from "multer";
import File from "fs";

const router = Router();

export const avatar = async (req: Request, res: Response) => {
  User.findById(req.body.userID)
    .then(async (user: any) => {
      if (user) {
        // @ts-ignore
        const multerReq = req as Request & { file?: File };
        if (!multerReq?.file) {
          // No file was uploaded, handle error
          res.status(400).json({ success: false, message: "No file uploaded" });
          return;
        }

        // Access the uploaded file using req.file
        const { filename, originalname } = multerReq.file;
        user.avatar = filename;
        await user.save();

        // Process the file as needed (e.g., save the filename to the user's profile)

        res.json({
          success: true,
          message: "Avatar uploaded successfully",
          filename,
          originalname,
          token: generateToken(user),
        });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    })
    .catch((error: any) => {
      console.error("Database error:", error);
      res.status(500).json({ success: false, message: "An error occurred" });
    });
};

export default router;
