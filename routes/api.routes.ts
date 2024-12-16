import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import * as profile from "../controllers/profiles.controller";
import * as avatar from "../controllers/avatar.controller";
import * as challenge from "../controllers/challenges.controller";
import * as farmChallenge from "../controllers/farmChallenge.controller";
import * as wallet from "../controllers/wallet.controller";
import * as game from "../controllers/game.controller";
import * as poolgame from "../controllers/poolgame.controller";
import * as task from "../controllers/task.controller";
import * as tasksuccess from "../controllers/tasksuccess.controller";
import * as bugreport from "../controllers/bug.controller";
import * as airdrop from "../controllers/airdrop.controller";
import * as Twitter from "../controllers/twitter.controller";
import * as bonus from "../controllers/bonus.controller";
import * as content from "../controllers/precontent.controller";

import axios from "axios";
// import Authenticate from "../service/auth";

import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Router
 * Using Passport
 */
const router = Router();

const uploadDir = path.join(__dirname, "../uploads");

// Create a storage engine for Multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

// Configure Multer with the storage engine
const upload = multer({ storage });

/// Test router
router.get("/", (req, res) => {
  console.log("server is running on 8000");
  res.send("server is running on 8000");
});

// AirDrop
router.post("/airdrop/followTwitter", airdrop.followerTwitter);
router.post("/airdrop/joinTelegram", airdrop.joinTelegram);
router.post("/airdrop/joinDiscord", airdrop.joinDiscord);

// Authentication
router.post("/signin", auth.SignIn);
router.post("/signup", auth.SignUp);
router.post("/email", auth.sendMail);
router.post("/getTwitAuth", auth.GetTwitAuth);
router.post("/signupTwit", auth.SignupTwit);
router.post("/getUser", auth.GetUser);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/getReferalInfo", auth.getReferalInfo);
router.post("/getEarnedMoney", auth.getEarnedMoney);
router.post("/getAllUser", auth.getAllUser);
router.post("/removeUser", auth.removeUser);
router.get("/ranking", auth.getRanking);
router.get("/getTwitInfo/:twitterId", auth.getTwitInfo);
router.get("/getUserScore/:userId", auth.getUserScore);
router.get("/getBoostedTweet", auth.getBoostedTweet);
router.post("/saveScore", auth.saveScore);
router.post("/followUs", auth.followUs);
router.post("/updateUserState/:userId", auth.updateUserState);
router.get("/refreshTime", auth.getRefreshTime);
router.post("/setRefreshTime", auth.setRefreshTime);
router.get("/getReferralCount/:userId", auth.getReferralCount);
router.get("/getRefPoint", auth.getRefPoint);
router.post("/setRefPoint", auth.setRefPoint);

// Bug-Report
router.post("/bug-report/create", bugreport.create);
router.post("/bug-report/getAll", bugreport.getAll);
router.post("/bug-report/getByUserId", bugreport.getByUserId);
router.post("/bug-report/updateBugStatus", bugreport.edit);
router.post("/bug-report/removeBugReport", bugreport.remove);

router.post("/addearnTweet", Twitter.addFarmEarnTweet);
router.post("/delEarn", Twitter.delFarmEarn);
router.get("/getEarn", Twitter.getFarmEarn);
router.post("/updateEarn", Twitter.updateFarmEarn);
router.get("/currentEarn", Twitter.getCurrentEarn);

router.post("/createPost", content.createContent);
router.get("/getPost", content.getContent);

router.post("/saveBonus", bonus.saveBonus);
router.get("/getBonus", bonus.getBonus);

// User panel
router.post("/profile/names", profile.names);
router.post("/profile/pwd", profile.password);
router.post("/profile/avatar", upload.single("avatar"), avatar.avatar);

// Pool game
router.get("/pool-game/index", poolgame.index);
router.post("/pool-game/save", poolgame.save);
router.post("/pool-game/opensave", poolgame.opensave);
router.post("/pool-game/start", poolgame.start);
router.post("/pool-game/end", poolgame.end);
router.post("/pool-game/challengehistory", poolgame.getAdminChallengeHistory);

// Administrator challenges
router.get("/challenge/index", challenge.index);
router.post("/challenge/save", challenge.save);
router.delete("/challenge/remove/:id", challenge.remove);
router.post("/challenge/searchByUser", challenge.searchByUser);

// farmChallenge

router.post("/farmChallenge/save", farmChallenge.save);
router.get("/farmChallenge/index", farmChallenge.index);
router.delete("/farmChallenge/remove/:id", farmChallenge.remove);
// router.post("/challenge/searchByUser", challenge.searchByUser);

// Wallet
router.post("/deposit", wallet.deposit);
router.post("/withdraw", wallet.withdraw);
router.post("/getUserInfo", wallet.getUserInfo);
router.post("/swap", wallet.swap);
router.post("/withdrawHistory", wallet.withdrawHistory);
router.post("/refreshWalletBalance", wallet.refreshWalletBalance);
router.post("/buyBitp", wallet.buyBITP);
// router.post("/charge", wallet.stripeCheck);

router.get("/admin/withdrawHistory", wallet.withdrawHistoryAdmin);
router.delete("/withdraw/remove/:id", wallet.remove);
router.get("/withdraw/check/:id", wallet.check);

// Game
router.post("/game/start", game.start);
router.post("/get-challenge-by-id", game.get_challenge_by_id);
router.post("/start-match", game.start_match);
router.post("/submit-match-result", game.submit_result);
router.post("/get-play-challenges", game.getPlayChallenges);

//Task
router.post("/task/getAll", task.getAll);
router.post("/task/new", task.create);
router.post("/task/remove", task.remove);
router.post("/task/edit", task.edit);

//TaskSuccess
router.post("/tasksuccess/userGetTaskData", tasksuccess.userGetTaskData);
router.post("/tasksuccess/userReportTask", tasksuccess.userReportTask);
router.post("/tasksuccess/adminGetTaskData", tasksuccess.adminGetTaskData);
router.post(
  "/tasksuccess/adminUpdateTaskStatus",
  tasksuccess.adminUpdateTaskStatus
);

export default router;
