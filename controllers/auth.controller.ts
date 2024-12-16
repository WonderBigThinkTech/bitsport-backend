import bcrypt from "bcrypt";
import ejs from "ejs";
import { query, Request, Response } from "express";
import User from "../models/User";
import Token from "../models/Token";
import crypto from "crypto";
import mailgun from "mailgun-js";
import needle from "needle";
import axios from "axios";

import { generateToken } from "../service/helpers";
import { CLIENT_URI, Mailgun_API_KEY } from "../config";
import { getEtherPrivateKeyAndWalletAddress } from "../service/wallet/ethers";
import { getTronPrivateKeyAndWalletAddress } from "../service/wallet/tron";
import { getBonus } from "./bonus.controller";
import BonusModel from "../models/BonusModel";
import FarmEarn from "../models/FarmEarn";
import RefreshTime from "../models/RefreshTime";
import RefPoint from "../models/RefPoint";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";

const mg = mailgun({
  apiKey: Mailgun_API_KEY,
  domain: "bitpool.gg",
});

export const sendEmail = async (email, subject, content) => {
  const data = {
    from: "hello@bitpool.gg", // Replace with your verified sender email (Mailgun domain email)
    to: email,
    subject: subject,
    html: content,
  };

  try {
    const result = await mg.messages().send(data);
    console.log("Email sent successfully:", result);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendMail = async (req, res) => {
  console.log(req.body.useremail);
  var transport = nodemailer.createTransport(
    smtpTransport({
      service: "Gmail",
      auth: {
        user: "stanislav.kogutstt2@gmail.com",
        pass: "phlbvyefyuiddptp",
      },
    })
  );
  var mailOptions = {
    from: "stanislav.kogutstt2@gmail.com", // sender address
    to: req.body.useremail, // list of receivers
    subject: "Verify Code", // Subject line
    html: `<html>
      <body>
        <div
          style="
            width: 600px;
            height: 800px;
            background-color: #191c25;
            margin: auto;
            color: white;
            padding: 50px;
          "
        >
          <h1>You are invited from Bitpool Game!</h1>
          <hr style="width: 100%; background-color: white" />
          <h3>Opponent:</h3>
          <h3>stanislav.kogutstt2@gmail.com</h3>
          <hr style="width: 100%; background-color: white" />
          <h4>You are invited from Bitpool Game.</h4>
          <h4>Please contact the game.</h4>
        </div>
      </body>
    </html>`,
  };
  transport.sendMail(mailOptions, function (error, response) {
    if (error) {
      res.send({ error: "Something wrong!" });
      console.log(error);
    } else {
      console.log("Suceess");
    }
  });
};

/**
 * User registration function
 * @param req
 * @param res
 * @returns
 */

const increaseReferralCnt = async (referralId: string) => {
  console.log("referral twitter id ====> ", referralId);

  if (!referralId || referralId == "") return;
  const user = await User.findOne({ "twitter.twitterScreenName": referralId });

  let tempCnt: number = user?.referralCnt as number;
  if (user && user.referralCnt !== undefined) {
    console.log("referral counts ====> ", user?.referralCnt);
    tempCnt++;
    user.referralCnt = tempCnt;
    await user.save();
  }
};

export const SignUp = async (req: Request, res: Response) => {
  if (!req.body.email || !req.body.password) {
    return res.json({
      success: false,
      message: "Please, send your email and password.",
    });
  }

  const existingUser = await User.findOne({ username: req.body.username });
  if (existingUser) {
    return res.json({ success: false, message: "Username already exists!" });
  }

  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.json({ success: false, message: "User already exists!" });
  }

  const ether = getEtherPrivateKeyAndWalletAddress();
  // const btc = getBTCPrivateKeyAndWalletAddress();
  const tron = getTronPrivateKeyAndWalletAddress();

  const buyBitpAddr = getEtherPrivateKeyAndWalletAddress();

  let length = 0;
  await User.find()
    .countDocuments()
    .then((data: any) => (length = data));

  const payload = {
    username: req.body.username,
    email: req.body.email,
    role: 0,
    password: req.body.password,
    referralCnt: 0,
    money: { busd: 0, usdt: 0, usd: 0, bitp: 0, quest: 3, cake: 0 },
    bonus: { busd: 0, usdt: 0, usd: 0, bitp: 0, quest: 0, cake: 0 },
    earnMoney: { busd: 0, usdt: 0, bitp: 0, cake: 0, usd: 0 },
    buy_BitpAddr: {
      privateKey: buyBitpAddr.privateKey,
      address: buyBitpAddr.address,
    },
    address: {
      ether: { privateKey: ether.privateKey, address: ether.address },
      bitcoin: { privateKey: ether.privateKey, address: ether.address },
      tron: {
        privateKey: (await tron).privateKey,
        address: (await tron).address,
      },
    },
    latestEarnAmount: 0,
    latestEarnUnit: "BUSD",
    latestPlayedTotalStreak: 0,
    latestPlayedCurStreak: 0,
    ipAddress: req.body.ipAddress,
    index: length + 1,
  };

  const newUser = new User(payload);
  const result = await newUser.save();

  res.json({ success: true, token: generateToken(result) });

  // const transfer = nodemailer.createTransport({
  //   host: 'email-smtp.us-west-1.amazonaws.com',
  //   port: 587,
  //   auth: {
  //     user: USER_EMAIL,
  //     pass: USER_PASSWORD
  //   },
  //   secure: false,
  //   requireTLS: true,
  //   from: "welcome@bitsport.gg"
  // });
  // const templatePath = path.resolve('../server/template');
  // const templateFile = await fs.readFileSync(templatePath + "/welcome.hbs", "utf8");
  // const template = handlebars.compile(templateFile);
  // let data = { username: req.body.username };
  // let html = template(data);

  // transfer.sendMail({
  //   from: `Bitsports <welcome@bitsport.gg>`,
  //   to: `${req.body.email}`,
  //   subject: `Success to receive from ${newUser.firstname} ${newUser.lastname}!`,
  //   html
  // }, (err, data) => {
  //   if(err) res.json({ success: false, message: 'Sorry! Request has an error!' });
  // else
  // });
};

export const getRefreshTime = async (req: Request, res: Response) => {
  try {
    const refreshTime = await RefreshTime.findOne();
    if (refreshTime) {
      res.json({ refreshTime: refreshTime.time });
    } else {
      const newTimeSchem = new RefreshTime({
        time: 24,
      });
      const newTime = await newTimeSchem.save();
      if (newTime) {
        res.json({ refreshTime: 24 });
      }
    }
  } catch (error) {
    console.log("refresh time error ===> ", error);
    res.status(500).json({ err: error });
  }
};

export const setRefreshTime = async (req: Request, res: Response) => {
  try {
    const { newTime } = req.body;
    if (!newTime)
      return res.status(500).json({ err: "Please send the newTime!" });
    const refreshTime = await RefreshTime.findOne();
    if (refreshTime) {
      const result = await RefreshTime.findByIdAndUpdate(
        refreshTime._id,
        { time: newTime },
        { new: true }
      );
      res.json({ refreshTime: result?.time });
    } else {
      const newTimeSchem = new RefreshTime({
        time: newTime,
      });
      const newTimeResult = await newTimeSchem.save();
      if (newTimeResult) {
        res.json({ refreshTime: newTime });
      }
    }
  } catch (error) {
    console.log("setting refresh time error ===> ", error);
    res.status(500).json({ err: error });
  }
};

export const getReferralCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    //@ts-ignore
    if (userId || userId != "") {
      const user = await User.findById(userId);
      if (user) {
        res.json({ refcount: user.referralCnt });
      } else {
        res.status(500).json({ err: "User does not exist!" });
      }
    } else {
      res.json({ refcount: 0 });
    }
  } catch (error) {
    console.log("getting referral count error ====> ", error);
    res.status(400).json({ err: error });
  }
};

export const getRefPoint = async (req: Request, res: Response) => {
  try {
    const refPoint = await RefPoint.findOne();
    if (refPoint) {
      res.json({ refPoint: refPoint.point });
    } else {
      const newTimeSchem = new RefPoint({
        point: 10,
      });
      const newTime = await newTimeSchem.save();
      if (newTime) {
        res.json({ refPoint: 10 });
      }
    }
  } catch (error) {
    console.log("ref point error ===> ", error);
    res.status(500).json({ err: error });
  }
};

export const setRefPoint = async (req: Request, res: Response) => {
  try {
    const { newPoint } = req.body;
    if (!newPoint)
      return res.status(500).json({ err: "Please send the newPoint!" });
    const point = await RefPoint.findOne();
    if (point) {
      const result = await RefPoint.findByIdAndUpdate(
        point._id,
        { point: newPoint },
        { new: true }
      );
      res.json({ newPoint: result?.point });
    } else {
      const newPointSchem = new RefPoint({
        point: newPoint,
      });
      const newPointResult = await newPointSchem.save();
      if (newPointResult) {
        res.json({ newPoint: newPoint });
      }
    }
  } catch (error) {
    console.log("setting ref poin error ===> ", error);
    res.status(500).json({ err: error });
  }
};

export const updateUserState = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const query = req.body;
    if (query.followed) {
      const updatedUser = await User.findByIdAndUpdate(userId, {
        "twitter.followed": true,
      });
      if (updatedUser) {
        res.json({ success: true });
      }
    } else if (query.tweetedRef) {
      const updatedUser = await User.findByIdAndUpdate(userId, {
        "twitter.tweetedRef": true,
      });
      if (updatedUser) {
        res.json({ success: true });
      }
    } else {
      const updatedUser = await User.findByIdAndUpdate(userId, {
        "twitter.sharedTweet": true,
      });
      if (updatedUser) {
        res.json({ success: true });
      }
    }
  } catch (error) {
    console.log("updating user error ===> ", error);
    res.status(500).json({ err: error });
  }
};

export const GetTwitAuth = async (req: Request, res: Response) => {
  if (!req.body.userId) {
    return res.json({
      success: false,
      message: "Please, send your id.",
    });
  }

  const result = await User.findOne({ _id: req.body.userId });
  if (result) {
    if (
      result.twitter.twitterName !== "" &&
      result.twitter.followed == true &&
      result.twitter.sharedTweet == true
    ) {
      return res.json({ success: true, message: "Check" });
    } else {
      return res.json({ success: false, message: "Check" });
    }
  }
};

export const GetUser = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({
      success: false,
      message: "Please, send your id.",
    });
  }

  try {
    const result = await User.findById(userId);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const getRanking = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ "twitter.twitterScore": { $gte: 50 } })
      .sort({ "twitter.twitterScore": -1 })
      .limit(10)
      .select("twitter.twitterScore twitter.twitterName")
      .lean()
      .exec();

    const formattedUsers = users.map((user) => ({
      userId: user._id.toString(),
      Score: user.twitter.twitterScore,
      userName: user.twitter.twitterName,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {}
};

export const SignupTwit = async (req: Request, res: Response) => {
  // console.log("signup twit", req.body)
  const {
    userId,
    twitterName,
    twitterId,
    twitterAvatar,
    twitterScreenName,
    refId,
  } = req.body;

  if (!userId || !twitterName || !twitterId || !twitterAvatar) {
    return res.json({
      success: false,
      message: "Please, send your id.",
    });
  }

  const user = await User.findById(userId);

  // Check the account is correct for sign up.
  const url = `https://api.twitter.com/2/users/${twitterId}`;

  const params = {
    "user.fields": "created_at,public_metrics",
  };

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
    },
  };

  try {
    const response = await needle("get", url, params, options);

    const period =
      new Date().getTime() - new Date(response.body.data.created_at).getTime();
    if (
      period / 1000 / 60 / 60 / 24 > 0 &&
      response.body.data.public_metrics.followers_count >= 0
    ) {
      try {
        const result = await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              "twitter.twitterId": twitterId,
              "twitter.twitterAvatar": twitterAvatar,
              "twitter.twitterName": twitterName,
              "twitter.twitterScreenName": twitterScreenName,
              referralId:
                refId && refId != "" && user?.referralId == ""
                  ? refId
                  : user?.referralId,
            },
          },
          { new: true }
        );
        console.log(
          "referral 1 twitter name ====> ",
          user?.twitter.twitterName
        );
        if (refId && refId != "" && !user?.twitter.twitterName) {
          console.log(
            "referral 2 twitter name ====> ",
            user?.twitter.twitterName
          );
          const refUser = await User.findOne({
            "twitter.twitterScreenName": refId,
          });
          if (refUser) {
            await increaseReferralCnt(refId);
          }
        }
        if (result) {
          return res.json({
            success: true,
            data: generateToken(result),
          });
        } else {
          return res.json({
            success: true,
          });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    } else {
      console.log("Your account age or count of followers less than standard.");
      return res.json({
        success: false,
        message: "Your account age or count of followers less than standard.",
      });
    }
  } catch (error) {
    console.log("twitter athenticate error", error);
    res.status(500).json({ err: error });
  }
};

export const getTwitInfo = async (req: Request, res: Response) => {
  const { twitterId } = req.params;

  try {
    // Construct the query parameters
    const hashtag1 = '"@bitsportgaming"';
    // const hashtag2 = '"$BITP"';
    const query = `${hashtag1} from:${twitterId}`;

    let allLikes = 0;
    let allTweets = 0;
    let allReplys = 0;
    let allQuotes = 0;

    console.log("twitter query", query);

    // Make a GET request to Twitter API's search endpoint
    const response = await axios.get(
      "https://api.twitter.com/2/tweets/search/recent",
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
        },
        params: {
          query: query,
        },
      }
    );

    console.log("response.data", response.data);

    if (
      response &&
      response.data &&
      response.data.data &&
      response.data.data.length != 0
    ) {
      for (let i = 0; i < response.data.data.length; i++) {
        console.log(
          "post number ===> ",
          i,
          " post id ",
          response.data.data[i].id
        );
        if (response.data.data[i].text.indexOf("RT @bitsportgaming") > -1) {
          if (i === response.data.data.length - 1) {
            console.log("result ========> ");
            setTimeout(async () => {
              res.json([
                { farm: allLikes, booster: 0 },
                { farm: allTweets, booster: 0 },
                { farm: allReplys, booster: 0 },
                { farm: allQuotes, booster: 0 },
              ]);
            }, 4000);
            break;
          } else {
            continue;
          }
        }
        const options = {
          method: "GET",
          url: `https://twitter-api45.p.rapidapi.com/tweet.php`,
          params: {
            id: response.data.data[i].id,
          },
          headers: {
            "X-RapidAPI-Key":
              "9eff990904msh4a7cd179bf2f5cep1e7f81jsn622cfe2e70a0",
            "X-RapidAPI-Host": "twitter-api45.p.rapidapi.com",
          },
        };

        try {
          setTimeout(async () => {
            const response2 = await axios.request(options);
            // console.log('response.data =====> ', response2.data)
            const likes = response2.data.likes;
            const retweets = response2.data.retweets;
            const replies = response2.data.replies;
            const quotes = response2.data.quotes;

            allLikes += likes ? likes : 0;
            console.log("tweet number =====> ", i, " likes ==========>", likes);
            allTweets += retweets ? retweets : 0;
            console.log(
              "tweet number =====> ",
              i,
              " retweets ==========>",
              retweets
            );
            allReplys += replies ? replies : 0;
            console.log(
              "tweet number =====> ",
              i,
              " replies ==========>",
              replies
            );
            allQuotes += quotes ? quotes : 0;
            console.log(
              "tweet number =====> ",
              i,
              " quotes ==========>",
              quotes
            );

            if (i === response.data.data.length - 1) {
              console.log("result ===========> ", i);
              setTimeout(async () => {
                res.json([
                  { farm: allLikes, booster: 0 },
                  { farm: allTweets, booster: 0 },
                  { farm: allReplys, booster: 0 },
                  { farm: allQuotes, booster: 0 },
                ]);
              }, 4000);
            }
          }, 2000);
        } catch (error) {
          console.error("error ===> too many request");
        }
      }
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { "twitter.twitterId": twitterId },
        {
          tweetStatus: [
            { farm: 0, booster: 0 },
            { farm: 0, booster: 0 },
            { farm: 0, booster: 0 },
            { farm: 0, booster: 0 },
          ],
        }
      );
      if (updatedUser) {
        res.json([
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
        ]);
      }
    }

    // Send the tweets back to the client
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({ error: "Error fetching tweets" });
  }
};

export const getUserScore = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (user) {
      if (user.tweetStatus.length == 0) {
        res.json([
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
          { farm: 0, booster: 0 },
        ]);
      } else {
        res.json(user.tweetStatus);
      }
    } else {
      res.json({ err: "User does not exist!" });
    }
  } catch (error) {
    console.log("get tweet user info ===> ", error);
    res.status(400).json({ err: "Unexpected error!" });
  }
};

export const followUs = async (req: Request, res: Response) => {
  try {
    const { accessToken, accessSecret, userId } = req.body;

    console.log("accesstoken =>>> ", accessToken);
    console.log("accessSecret =>>> ", accessSecret);
    console.log("userId =>>> ", userId);

    // if (accessSecret && accessToken !== "") {
    //   const second_client = new Twitter({
    //     consumer_key: 'X3lCNWJYUW5rMTUyQWtWNElkQUY6MTpjaQ',
    //     consumer_secret: 'FYoPeqFZlDvzUGZnyAoH80JfUeqb6Bg7g1L6MS0-9KBXgJKkgi',
    //     access_token_key: accessToken,
    //     access_token_secret: accessSecret,
    //     version: "2.0"
    //   })

    //   const results = await second_client.post(`users/${userId}/following`, {
    //     "target_user_id": "1092146379353452551"
    //   });

    //   console.log("following result ===> ", results)
    // request.post({
    //   url: `https://api.twitter.com/2/users/${userId}/following`,
    //   oauth: {
    //     consumer_key: 'X3lCNWJYUW5rMTUyQWtWNElkQUY6MTpjaQ',
    //     consumer_secret: 'FYoPeqFZlDvzUGZnyAoH80JfUeqb6Bg7g1L6MS0-9KBXgJKkgi',
    //     access_token_key: accessToken,
    //     access_token_secret: accessSecret,
    //   },
    //   json: true,
    //   // form: { oauth_verifier: req.query.oauth_verifier },

    //   body: {
    //     "target_user_id": "1092146379353452551"
    //   }
    // }, function (err1, r1, body1) {
    //   if (err1) {
    //     console.log("There was an error through following");
    //     res.status(404).json({ msg: "There was an error through following" })
    //   } else {
    //     res.json("Success")
    //   }
    // })

    //   // const results = await client.post("friendships/create", {
    //   //   screen_name: twitter_name,
    //   // });

    //   const twitter = second_client.readWrite
    //   const rest = await twitter.v2.usersByUsernames('bitsportgaming');
    //   await twitter.v2.follow(userId, rest.data[0].id)
    //   console.log("finished")

    // const response = await client.post("friendships/create", {
    //   screen_name: 'bitsportgaming'
    // })

    // if (response) {
    //   res.json({success: true})
    // } else {
    //   res.json({success: false})
    // }
  } catch (error) {
    console.log("follow us error ===> ", error);
    res.status(400).json({ err: error });
  }
};

export const saveScore = async (req: Request, res: Response) => {
  try {
    const { tweetStatus, score, userId } = req.body;
    const nowDate = new Date(Date.now());
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        tweetStatus: tweetStatus,
        "twitter.twitterScore": score,
        refresh: nowDate,
      },
      { new: true }
    );
    if (updatedUser) {
      res.json({ success: true, token: generateToken(updatedUser) });
    } else {
      res.json({ success: false });
    }
  } catch (error) {}
};

export const getBoostedTweet = async (req: Request, res: Response) => {
  try {
    const boostTweets = await FarmEarn.find({ tweetType: "Booster" });
    res.json(boostTweets);
  } catch (error) {
    console.log("getting boosted tweet error", error);
    res.status(500).json({ err: error });
  }
};

/**
 * User login function
 * @param req
 * @param res
 * @returns
 */
export const SignIn = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.body.email || !req.body.password) {
    return res.json({ success: false, message: "No Input Data!" });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ success: false, message: "User does not exists!" });
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (isMatch) {
    await refreshUserInfo(user);
    console.log("sigin in user", user);
    return res.json({ success: true, token: generateToken(user) });
  }

  return res.json({
    success: false,
    message: "The email or password are incorrect!",
  });
};

/**
 * User forgotPassword function
 * @param req
 * @param res
 * @returns
 */
export const forgotPassword = async (req: Request, res: Response) => {
  if (!req.body.email) {
    return res.json({ success: false, message: "No Input Data!" });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ success: false, message: "User does not exists!" });
  }

  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  let resetToken = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(resetToken, 10);

  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();

  const link = `${CLIENT_URI}/passwordReset?token=${resetToken}&id=${user._id}`;

  // sgMail.setApiKey(`${SENDGRID_API_KEY}`);

  // const sendEmail = async (email, subject, content) => {
  //   const msg = {
  //     to: email,
  //     from: '', // Replace with your verified sender email
  //     subject: subject,
  //     html: content,
  //   };

  //   try {
  //     await sgMail.send(msg);
  //     console.log('Email sent successfully');
  //   } catch (error) {
  //     console.error('Error sending email:', error);
  //   }
  // };

  const template = await ejs.renderFile("utils/email/template.ejs", {
    link,
  });

  await sendEmail(user.email, "Password Reset Request", template);

  return res.json({
    success: true,
    message: "Email sent successfully!",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  let passwordResetToken = await Token.findOne({ userId: req.body.userId });
  if (!passwordResetToken) {
    return res.json({
      success: false,
      message: "Invalid or expired password reset token!",
    });
  }
  const isValid = await bcrypt.compare(
    req.body.token,
    passwordResetToken.token
  );
  if (!isValid) {
    return res.json({
      success: false,
      message: "Invalid or expired password reset token!!",
    });
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.updateOne(
    { _id: req.body.userId },
    { $set: { password: hash } },
    { new: true }
  );
  const user = await User.findById({ _id: req.body.userId });

  await passwordResetToken.deleteOne();
  res.json({ success: true, message: "Updated your password successfully!" });
};

export const getReferalInfo = async (req: Request, res: Response) => {
  const user = await User.findById(req.body.userId);
  const referralFriends = await User.find({
    referralId: user?.twitter.twitterScreenName,
  });
  const data = referralFriends.map((item) => {
    return { username: item.username, earnMoney: item.earnMoney };
  });
  return res.json({
    success: true,
    data: data,
  });
};

export const getEarnedMoney = async (req: Request, res: Response) => {
  const user = await User.findById(req.body.userId);
  return res.json({
    success: true,
    latestEarnedAmount: user?.latestEarnAmount,
    latestEarnedUnit: user?.latestEarnUnit,
    totalEarnedMoney: user?.earnMoney,
    totalStreak: user?.latestPlayedTotalStreak,
    curStreak: user?.latestPlayedCurStreak,
  });
};

export const getAllUser = async (req: Request, res: Response) => {
  User.find().then((models: any) => {
    res.json({ models });
  });
};

export const removeUser = async (req: Request, res: Response) => {
  User.findByIdAndDelete(req.body.userId).then((model: any) => {
    res.json({ success: true, model });
  });
};

export const refreshUserInfo = async (user: any) => {
  if (user.buy_BitpAddr.address == undefined) {
    user.buy_BitpAddr = getEtherPrivateKeyAndWalletAddress();
    await user.save();
  }
};

// export const edit = async (req: Request, res: Response) => {
//   User.findOne({
//     _id: req.body.userId,
//   }).then(async (model: any) => {
//     if (!model) res.json({ success: false, message: "The Task not exits!" });
//     model.title = req.body.title;
//     model.description = req.body.description;
//     model.reward = req.body.reward;
//     model.unit = req.body.unit;
//     model.status = req.body.status;
//     model.shared = req.body.shared;
//     model.save().then(() => {
//       res.json({ success: true, model });
//     });
//   });
// };
