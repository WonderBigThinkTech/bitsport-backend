import { SERVER_PORT } from "./config";
import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import needle from "needle";

import passport from "passport";
import middlewarePassport from "./service/passport";

import apiRoutes from "./routes/api.routes";
import User from "./models/User";
import FarmEarn from "./models/FarmEarn";
import BonusModel from "./models/BonusModel";
const app = express();

// Settings
app.set("port", SERVER_PORT);

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', 'https://bitpool-front.vercel.app');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   next();
// });

// const whitelist = ['https://bitpool-front.vercel.app', 'http://localhost:3000'];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//   } else {
//    callback(new Error('Not allowed by CORS'));
//   }
//  },
// };

// Middlewares
app.use(cors());

app.use(express.json());
app.use(express.static("./client/build"));
app.use(express.urlencoded({ extended: false }));

// Passport
app.use(passport.initialize());
passport.use(middlewarePassport);

// Routes
app.use("/api", apiRoutes);

// app.get("*", (req, res) => {
//   fs.readFile(
//     "./client/build/index.html",
//     { encoding: "utf-8" },
//     (err, data) => {
//       if (!data) res.send("Server is running on Port 8000");
//       else res.send(data);
//     }
//   );
// });

// const getInvesters = async () => {
//   setInterval(async () => {
//     const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";
//     const today = new Date();
//     const startday = new Date(
//       today.setMinutes(today.getMinutes() - 2)
//     ).toISOString();
//     const endTime = new Date(new Date().getTime() - 10 * 1000).toISOString();
//     const farm = await FarmEarn.find({});
//     const params = {
//       query: `${process.env.TWITTER_NAME}`,
//       start_time: startday,
//       end_time: endTime,
//       expansions: "author_id",
//       "user.fields": "id,username",
//     };

//     const content =
//       farm.length > 0
//         ? process.env.TWITTER_NAME + " " + farm[0].content
//         : process.env.TWITTER_NAME;

//     console.log("fam", content);

//     needle("get", endpointUrl, params, {
//       headers: {
//         "User-Agent": "v2RecentSearchJS",
//         authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
//       },
//       timeout: 20000,
//     }).then((response) => {
//       if (response.body.meta.result_count) {
//         const tweets = response.body.data;
//         const users = response.body.includes.users;

//         tweets.map(async (tweet) => {
//           const userDetails = users.find((user) => user.id === tweet.author_id);
//           let type = 0;
//           if (tweet.text === content) {
//             if (farm[0].tweetType === "Farm") {
//               type = 1;
//             } else {
//               type = 2;
//             }
//           }
//           let tweetState;
//           if (tweet.author_id === userDetails.id) {
//             tweetState = {
//               tweetId: tweet.id,
//               tweetType: type,
//             };
//           }
//           await User.findOneAndUpdate(
//             {
//               "twitter.twitterId": userDetails.id,
//             },
//             {
//               $push: {
//                 "twitter.tweetStatus": tweetState,
//               },
//               $set: { "twitter.twitterScore": 0 },
//             },
//             { new: true }
//           );
//         });
//         console.log("done");
//       }
//     });
//   }, 120000);
// };

// // getInvesters();

// const getTweetInfos = async () => {
//   setInterval(async () => {
//     const [allBonus, allFarmEarns, allUsers] = await Promise.all([
//       BonusModel.find(),
//       FarmEarn.find(),
//       User.find(),
//     ]);

//     console.log("fetching like ....");
//     const allLikes = (
//       await Promise.all(
//         allFarmEarns.map(async (farmEarn) => {
//           const url = `https://api.twitter.com/2/tweets/${farmEarn.tweetId}/liking_users`;

//           const params = {
//             "user.fields": "name,id,username",
//             "max_results":100
//           };
//           const res = await needle("get", url, params, {
//             headers: {
//               authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
//             },
//           });

//           if (res.body.data) {
//             return res.body.data.map((like) => ({
//               ...like,
//               type: farmEarn.tweetType,
//             }));
//           }
//         })
//       )
//     ).flat();

//     const allRetweets = (
//       await Promise.all(
//         allFarmEarns.flatMap(async (farmEarn) => {
//           const url = `https://api.twitter.com/2/tweets/${farmEarn.tweetId}/retweeted_by`;

//           const params = {
//             "user.fields": "name,id,username",
//             "max_results":100
//           };
//           const res = await needle(
//             "get",
//             url,
//             params,
//             {
//               headers: {
//                 authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
//               },
//             }
//           );
//           if (res.body.data) {
//             return res.body.data.map((quote) => ({
//               ...quote,
//               type: farmEarn.tweetType,
//             }));
//           }
//         })
//       )
//     ).flat();

//     const allReplys = await Promise.all(
//       allFarmEarns.flatMap(async (farmEarn) => {
//         const url = `https://api.twitter.com/2/tweets/search/recent`;

//         const params = {
//           query: `conversation_id:${farmEarn.tweetId}`,
//           "user.fields": "name,id,username",
//           "max_results":100
//         };
//         const res = await needle("get", url, params, {
//           headers: {
//             authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
//           },
//         });

//         return { info: res.body.data, type: farmEarn.tweetType };
//       })
//     );

//     const allQuotes = (
//       await Promise.all(
//         allFarmEarns.flatMap(async (farmEarn) => {
//           const url = `https://api.twitter.com/2/tweets/${farmEarn.tweetId}/quote_tweets`;

//           const params = {
//             "user.fields": "name,id,username",
//             "max_results":100
//           };
//           const res = await needle(
//             "get",
//             url,
//             params,
//             {
//               headers: {
//                 authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
//               },
//             }
//           );
//           if (res.body.data) {
//             return res.body.data.map((quote) => ({
//               ...quote,
//               type: farmEarn.tweetType,
//             }));
//           }
//         })
//       )
//     ).flat();

//     console.log("allLikes", allLikes);
//     console.log("allRetweets", allRetweets);
//     try {
//       await Promise.all(
//         allUsers.map(async (user) => {
//           if (
//             allLikes.length === 0 ||
//             allRetweets.length === 0
//             // allQuotes.length !== 0
//           ) {
//             return;
//           }

//           console.log("updating --------", user._id);
//           const likeCounts = allLikes.reduce(
//             (acc, like) => {
//               if (like.id === user.twitter.twitterId) {
//                 if (like.type === "Farm") acc.farmLikeCount += 1;
//                 if (like.type === "Booster") acc.boosterLikeCount += 1;
//               }
//               return acc;
//             },
//             { farmLikeCount: 0, boosterLikeCount: 0 } // Initial accumulator object
//           );
//           const { farmLikeCount, boosterLikeCount } = likeCounts;

//           const retweetCounts = allRetweets.reduce(
//             (acc, retweek) => {
//               if (retweek?.id === user.twitter.twitterId) {
//                 if (retweek?.type === "Farm") acc.farmRetweetCount += 1;
//                 if (retweek?.type === "Booster") acc.boosterRetwetCount += 1;
//               }
//               return acc;
//             },
//             { farmRetweetCount: 0, boosterRetwetCount: 0 }
//           );
//           const { farmRetweetCount, boosterRetwetCount } = retweetCounts;
//           const replyCounts = allReplys.reduce(
//             (acc, reply) => {
//               if (reply.info && reply.info.id === user.twitter.twitterId) {
//                 if (reply.type === "Farm") acc.farmReplyCount += 1;
//                 if (reply.type === "Booster") acc.boosterReplyCount += 1;
//               }
//               return acc;
//             },
//             { farmReplyCount: 0, boosterReplyCount: 0 } // Initial accumulator object
//           );
//           const { farmReplyCount, boosterReplyCount } = replyCounts;
//           const quoteCounts = allQuotes.reduce(
//             (acc, quote) => {
//               if (quote.id === user.twitter.twitterId) {
//                 if (quote.type === "Farm") acc.farmQuoteCount += 1;
//                 if (quote.type === "Booster") acc.boosterQuoteCount += 1;
//               }
//               return acc;
//             },
//             { farmQuoteCount: 0, boosterQuoteCount: 0 } // Initial accumulator object
//           );
//           const { farmQuoteCount, boosterQuoteCount } = quoteCounts;
//           // console.log("farmRetweetCount", farmRetweetCount);
//           // console.log("farmReplyCount", farmReplyCount);
//           // console.log("farmQuoteCount", farmQuoteCount);
//           const updatedUser = await User.findByIdAndUpdate(user._id, {
//             tweetStatus: [
//               { farm: farmLikeCount, booster: boosterLikeCount },
//               { farm: farmRetweetCount, booster: boosterRetwetCount },
//               { farm: farmReplyCount, booster: boosterReplyCount },
//               { farm: farmQuoteCount, booster: boosterQuoteCount },
//             ],
//           });
//           console.log("updatedUser", updatedUser);
//           console.log("done--------");
//         })
//       );
//     } catch (e) {
//       console.log(e);
//     }
//   }, 120000);
// };

// getTweetInfos();

// const updateTwitterScore = async () => {
//   setInterval(async () => {
//     try {
//       const users = await User.find({});
//     const bonus = await BonusModel.find({});
//     const tempBonus = bonus[0].matrix;

//     const bulkOps = users.map((user) => {
//       console.log("userid is ", user._id);
//       const tempInfo = user.tweetStatus;
//       if (tempInfo.length > 0) {
//         const score =
//           tempInfo[0].farm * tempBonus[1][0] +
//           tempInfo[0].booster * tempBonus[2][0] +
//           tempInfo[1].farm * tempBonus[1][1] +
//           tempInfo[1].booster * tempBonus[2][1] +
//           tempInfo[2].farm * tempBonus[1][2] +
//           tempInfo[2].booster * tempBonus[2][2] +
//           tempInfo[3].farm * tempBonus[1][3] +
//           tempInfo[3].booster * tempBonus[2][3];

//         console.log("score is ", score);
//         return {
//           updateOne: {
//             filter: { _id: user._id },
//             update: { "twitter.twitterScore": score },
//           },
//         };
//       } else {
//         return {
//           updateOne: {
//             filter: { _id: user._id },
//             update: { "twitter.twitterScore": 0 },
//           },
//         };
//       }
//     });

//     if (bulkOps.length > 0) {
//       await User.bulkWrite(bulkOps);
//     }
//     } catch (error) {
//      console.log("updating user error ====> ", error)
//     }

//   }, 60000);
// };

// updateTwitterScore();

export default app;
