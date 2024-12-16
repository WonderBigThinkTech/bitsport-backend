import User from "../models/User";
import { generateToken } from "../service/helpers";
import { Request, Response } from "express";

// export const setupWebSocket = (server) => {
//   const wss = new WebSocket.Server({ server });

//   wss.on("connection", (ws) => {
//     console.log("Client connected");

//     ws.on("message", (message) => {
//       console.log(`Received: ${message}`);
//     });

//     ws.send("Welcome to the server!");
//   });

//   console.log("WebSocket server set up");
// };

export const followerTwitter = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      user.airdropIndex = 1;
      user.save();
      res.json({
        success: true,
        token: generateToken(user),
      });
    } else {
      res.json({
        success: false,
      });
    }
  });
};

export const joinDiscord = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      user.airdropIndex = 3;
      user.save();

      if (user.referralId != 0) {
        User.findOne({ index: user.referralId }).then((user1: any) => {
          if (user1.airdropIndex == 3) {
            user1.money.bitp += 10;
            user1.save();
          }
        });
      }
      res.json({
        success: true,
        token: generateToken(user),
      });
    } else {
      res.json({
        success: false,
      });
    }
  });
};

export const joinTelegram = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      user.airdropIndex = 2;
      user.save();
      res.json({
        success: true,
        token: generateToken(user),
      });
    } else {
      res.json({
        success: false,
      });
    }
  });
};
