import { Request, Response } from "express";
import PoolChallenges from "../models/PoolChallenges";
import PoolChallengeHistory from "../models/PoolChallengeHistory";
import User from "../models/User";
import { generateToken } from "../service/helpers";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";

export const index = async (req: Request, res: Response) => {
  PoolChallenges.find()
    .populate({
      path: "create_userid",
      select: "-address", // Exclude the "address" field from the populated "create_userid" document
    })
    .populate({
      path: "opponent_userid",
      select: "-address", // Exclude the "address" field from the populated "opponent_userid" document
    })
    .sort({ createdAt: -1 })
    .then((models: any) => {
      res.json({ models });
    })
    .catch((err: any) => {
      res.json({});
    });
};

export const getAdminChallengeHistory = async (req: Request, res: Response) => {
  PoolChallengeHistory.find({ challengeid: req.body.challengeid })
    .populate("challengeid")
    .populate("game_userid")
    .then((poolchallengehistory) => {
      res.json(poolchallengehistory);
    })
    .catch((err) => {
      res.json({ success: false, message: "error!" });
    });
};

export const opensave = async (req: Request, res: Response) => {
  User.findOne({
    _id: req.body.create_userid,
  }).then((cuser: any) => {
    var errFlag = false;
    if (req.body.coin_type === 1) {
      if (cuser.money.bitp < req.body.amount) {
        errFlag = true;
        res.json({ success: false, message: "Insufficient BITP balance!" });
      } else {
        errFlag = false;
      }
    } else if (req.body.coin_type === 2) {
      if (cuser.money.busd < req.body.amount) {
        errFlag = true;
        res.json({ success: false, message: "Insufficient BUSD balance!" });
      } else {
        errFlag = false;
      }
    } else if (req.body.coin_type === 3) {
      if (cuser.money.usdt < req.body.amount) {
        errFlag = true;
        res.json({ success: false, message: "Insufficient USDT balance!" });
      } else {
        errFlag = false;
      }
    } else {
      if (cuser.money.cake < req.body.amount) {
        errFlag = true;
        res.json({ success: false, message: "Insufficient CAKE balance!" });
      } else {
        errFlag = false;
      }
    }

    if (!errFlag) {
      const newPoolChallenge = new PoolChallenges({
        create_userid: req.body.create_userid,
        opponent_userid: req.body.create_userid,
        status_num: 0,
        coin_type: req.body.coin_type,
        amount: req.body.amount,
        gametype: false,
      });

      newPoolChallenge.save().then((poolchallenge: any) => {
        res.json({ success: true, message: "Success!" });
      });
    }
  });
};

export const save = async (req: Request, res: Response) => {
  console.log("TEST DATA : ", req.body);

  User.findOne({
    username: req.body.opponent_username.substr(
      1,
      req.body.opponent_username.length
    ),
  }).then((model: any) => {
    if (model) {
      User.findOne({
        _id: req.body.create_userid,
      }).then((cuser: any) => {
        var errFlag = false;
        if (req.body.coin_type === 1) {
          if (cuser.money.bitp < req.body.amount) {
            errFlag = true;
            res.json({ success: false, message: "Insufficient BITP balance!" });
          } else {
            errFlag = false;
          }
        } else if (req.body.coin_type === 2) {
          if (cuser.money.busd < req.body.amount) {
            errFlag = true;
            res.json({ success: false, message: "Insufficient BUSD balance!" });
          } else {
            errFlag = false;
          }
        } else if (req.body.coin_type === 3) {
          if (cuser.money.usdt < req.body.amount) {
            errFlag = true;
            res.json({ success: false, message: "Insufficient USDT balance!" });
          } else {
            errFlag = false;
          }
        } else {
          if (cuser.money.cake < req.body.amount) {
            errFlag = true;
            res.json({ success: false, message: "Insufficient CAKE balance!" });
          } else {
            errFlag = false;
          }
        }

        if (!errFlag) {
          const newPoolChallenge = new PoolChallenges({
            create_userid: req.body.create_userid,
            opponent_userid: model.id,
            status_num: 0,
            coin_type: req.body.coin_type,
            amount: req.body.amount,
            gametype: true,
          });

          var transport = nodemailer.createTransport(
            smtpTransport({
              service: "Gmail",
              auth: {
                user: "play@bitpool.gg",
                pass: "kowolybekwavwwvr",
              },
            })
          );

          // setup e-mail data with unicode symbols
          var mailOptions = {
            from: "play@bitpool.gg", // sender address
            to: model.email, // list of receivers
            subject: "BitPoolGame Request from Bitsport", // Subject line
            html:
              `<html>
                <body>
                  <div>
                    <p style="font-size: 32px; font-weight: bolder">
                      You received a pool game request from ` +
              cuser.email +
              `</p>
                  </div>
                </body>
              </html>`,
          };

          // send mail with defined transport object
          transport.sendMail(mailOptions, function (error, response) {
            if (error) {
              // res.send({ error: "Something wrong!" });
              console.log("Something wrong!");
              console.log(error);
            } else {
              console.log("mail sent!");
            }
          });

          newPoolChallenge.save().then((poolchallenge: any) => {
            res.json({ success: true, message: "Success!" });
          });
        }
      });
    } else {
      res.json({ success: false, message: "The opponent is not existing!" });
    }
  });
};

export const end = async (req: Request, res: Response) => {
  PoolChallenges.findById(req.body.cid)
    .then((poolchallenge: any) => {
      if (poolchallenge.coin_type === 1) {
        User.findById(req.body.uid).then((cuser: any) => {
          cuser.money.bitp = req.body.flag
            ? cuser.money.bitp +
              Number(Number(poolchallenge.amount + poolchallenge.amount) * 0.98)
            : cuser.money.bitp;
          cuser
            .save()
            .then((users: any) => {
              poolchallenge.status_num = poolchallenge.status_num + 1;
              poolchallenge.save().then((pools: any) => {
                const newPoolChallengeHistory = new PoolChallengeHistory({
                  challengeid: req.body.cid,
                  game_userid: req.body.uid,
                  game_result: req.body.result,
                });

                newPoolChallengeHistory.save().then((poolchallengehis: any) => {
                  res.json({
                    success: true,
                    message: "End",
                    token: generateToken(users),
                  });
                });
              });
            })
            .catch((err: any) => {
              res.json({ success: false, message: "error" });
            });
        });
      } else if (poolchallenge.coin_type === 2) {
        User.findById(req.body.uid).then((cuser: any) => {
          cuser.money.busd = req.body.flag
            ? cuser.money.busd +
              Number(Number(poolchallenge.amount + poolchallenge.amount) * 0.95)
            : cuser.money.busd;
          cuser
            .save()
            .then((users: any) => {
              poolchallenge.status_num = poolchallenge.status_num + 1;
              poolchallenge.save().then((pools: any) => {
                const newPoolChallengeHistory = new PoolChallengeHistory({
                  challengeid: req.body.cid,
                  game_userid: req.body.uid,
                  game_result: req.body.result,
                });

                newPoolChallengeHistory.save().then((poolchallengehis: any) => {
                  res.json({
                    success: true,
                    message: "End",
                    token: generateToken(users),
                  });
                });
              });
            })
            .catch((err: any) => {
              res.json({ success: false, message: "error" });
            });
        });
      } else if (poolchallenge.coin_type === 3) {
        User.findById(req.body.uid).then((cuser: any) => {
          cuser.money.usdt = req.body.flag
            ? cuser.money.usdt +
              Number(Number(poolchallenge.amount + poolchallenge.amount) * 0.95)
            : cuser.money.usdt;
          cuser
            .save()
            .then((users: any) => {
              poolchallenge.status_num = poolchallenge.status_num + 1;
              poolchallenge.save().then((pools: any) => {
                const newPoolChallengeHistory = new PoolChallengeHistory({
                  challengeid: req.body.cid,
                  game_userid: req.body.uid,
                  game_result: req.body.result,
                });

                newPoolChallengeHistory.save().then((poolchallengehis: any) => {
                  res.json({
                    success: true,
                    message: "End",
                    token: generateToken(users),
                  });
                });
              });
            })
            .catch((err: any) => {
              res.json({ success: false, message: "error" });
            });
        });
      } else {
        User.findById(req.body.uid).then((cuser: any) => {
          cuser.money.cake = req.body.flag
            ? cuser.money.cake +
              Number(Number(poolchallenge.amount + poolchallenge.amount) * 0.95)
            : cuser.money.cake;
          cuser
            .save()
            .then((users: any) => {
              poolchallenge.status_num = poolchallenge.status_num + 1;
              poolchallenge.save().then((pools: any) => {
                const newPoolChallengeHistory = new PoolChallengeHistory({
                  challengeid: req.body.cid,
                  game_userid: req.body.uid,
                  game_result: req.body.result,
                });

                newPoolChallengeHistory.save().then((poolchallengehis: any) => {
                  res.json({
                    success: true,
                    message: "End",
                    token: generateToken(users),
                  });
                });
              });
            })
            .catch((err: any) => {
              res.json({ success: false, message: "error" });
            });
        });
      }
    })
    .catch((err: any) => {
      res.json({ success: false, message: "error" });
    });
};

export const start = async (req: Request, res: Response) => {
  PoolChallenges.findOne({ _id: req.body.cid })
    .then((poolchallenge: any) => {
      if (poolchallenge.gametype) {
        if (poolchallenge.create_userid == req.body.uid) {
          User.findOne({ _id: req.body.uid })
            .then((cuser: any) => {
              var errFlag = false;
              if (poolchallenge.coin_type === 1) {
                if (cuser.money.bitp < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient BITP balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinUser === false) {
                    poolchallenge.joinUser = true;
                    cuser.money.bitp = cuser.money.bitp - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else if (poolchallenge.coin_type === 2) {
                if (cuser.money.busd < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient BUSD balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinUser === false) {
                    poolchallenge.joinUser = true;
                    cuser.money.busd = cuser.money.busd - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else if (poolchallenge.coin_type === 3) {
                if (cuser.money.usdt < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient USDT balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinUser === false) {
                    poolchallenge.joinUser = true;
                    cuser.money.usdt = cuser.money.usdt - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else {
                if (cuser.money.cake < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient CAKE balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinUser === false) {
                    poolchallenge.joinUser = true;
                    cuser.money.cake = cuser.money.cake - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              }

              // if (!errFlag) {
              //   poolchallenge.status_num = poolchallenge.status_num + 1;
              //   poolchallenge.save().then(() => {
              //     res.json({
              //       success: true,
              //       message: "Connected the Game!",
              //     });
              //   });
              // }
            })
            .catch((err: any) => {
              res.json({ success: false, message: err });
            });
        } else if (poolchallenge.opponent_userid == req.body.uid) {
          User.findOne({ _id: req.body.uid })
            .then((cuser: any) => {
              var errFlag = false;
              if (poolchallenge.coin_type === 1) {
                if (cuser.money.bitp < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient BITP balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinOpponent === false) {
                    poolchallenge.joinOpponent = true;
                    cuser.money.bitp = cuser.money.bitp - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else if (poolchallenge.coin_type === 2) {
                if (cuser.money.busd < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient BUSD balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinOpponent === false) {
                    poolchallenge.joinOpponent = true;
                    cuser.money.busd = cuser.money.busd - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else if (poolchallenge.coin_type === 3) {
                if (cuser.money.usdt < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient USDT balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinOpponent === false) {
                    poolchallenge.joinOpponent = true;
                    cuser.money.usdt = cuser.money.usdt - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              } else {
                if (cuser.money.cake < poolchallenge.amount) {
                  errFlag = true;
                  res.json({
                    success: false,
                    message: "Insufficient CAKE balance!",
                  });
                } else {
                  errFlag = false;
                  if (poolchallenge.joinOpponent === false) {
                    poolchallenge.joinOpponent = true;
                    cuser.money.cake = cuser.money.cake - poolchallenge.amount;
                  }
                  cuser.save().then((cusers: any) => {
                    poolchallenge.status_num = poolchallenge.status_num + 1;
                    poolchallenge.save().then((pppoolchange: any) => {
                      User.findOne({ _id: req.body.uid })
                        .then((users: any) => {
                          res.json({
                            success: true,
                            message: "Connected the Game!",
                            token: generateToken(users),
                          });
                        })
                        .catch((err: any) => {
                          res.json({
                            success: false,
                            message: "error",
                            token: "",
                          });
                        });
                    });
                  });
                }
              }

              if (!errFlag) {
                poolchallenge.status_num = poolchallenge.status_num + 1;
                poolchallenge.save().then(() => {
                  res.json({
                    success: true,
                    message: "Connected the Game!",
                  });
                });
              }

              if (!errFlag) {
                User.findOne({ _id: poolchallenge.create_userid }).then(
                  (createdUser: any) => {
                    var transport = nodemailer.createTransport(
                      smtpTransport({
                        service: "Gmail",
                        auth: {
                          user: "stanislav.kogutstt2@gmail.com",
                          pass: "phlbvyefyuiddptp",
                        },
                      })
                    );

                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                      from: "stanislav.kogutstt2@gmail.com", // sender address
                      to: createdUser.email, // list of receivers
                      subject: "BitPoolGame Acception from Bitsport", // Subject line
                      html:
                        `<html>
                        <body>
                          <div>
                            <p style="font-size: 32px; font-weight: bolder">
                            ` +
                        cuser.username +
                        ` accepted your pool game request. 
                            </p>
                          </div>
                        </body>
                      </html>`,
                    };

                    // send mail with defined transport object
                    transport.sendMail(mailOptions, function (error, response) {
                      if (error) {
                        // res.send({ error: "Something wrong!" });
                        console.log(error);
                      } else {
                        console.log("mail sent!");
                      }
                    });
                  }
                );
              }
            })
            .catch((err: any) => {
              res.json({ success: false, message: err });
            });
        } else {
          res.json({
            success: false,
            message: "You are not a creator or opponent!",
          });
        }
      } else {
        User.findOne({ _id: req.body.uid })
          .then((cuser: any) => {
            var errFlag = false;
            if (poolchallenge.coin_type === 1) {
              if (cuser.money.bitp < poolchallenge.amount) {
                errFlag = true;
                res.json({
                  success: false,
                  message: "Insufficient BITP balance!",
                });
              } else {
                errFlag = false;
                cuser.money.bitp = cuser.money.bitp - poolchallenge.amount;
                cuser.save().then((cusers: any) => {
                  poolchallenge.status_num = poolchallenge.status_num + 1;
                  if (
                    poolchallenge.create_userid.toString() ===
                    cuser._id.toString()
                  ) {
                    poolchallenge.create_userid = cuser._id;
                    poolchallenge.joinUser = true;
                  } else {
                    poolchallenge.opponent_userid = cuser._id;
                    poolchallenge.joinOpponent = true;
                  }
                  poolchallenge.save().then((pppoolchange: any) => {
                    User.findOne({ _id: req.body.uid })
                      .then((users: any) => {
                        res.json({
                          success: true,
                          message: "Connected the Game!",
                          token: generateToken(users),
                        });
                      })
                      .catch((err: any) => {
                        res.json({
                          success: false,
                          message: "error",
                          token: "",
                        });
                      });
                  });
                });
              }
            } else if (poolchallenge.coin_type === 2) {
              if (cuser.money.busd < poolchallenge.amount) {
                errFlag = true;
                res.json({
                  success: false,
                  message: "Insufficient BUSD balance!",
                });
              } else {
                errFlag = false;
                cuser.money.busd = cuser.money.busd - poolchallenge.amount;
                cuser.save().then((cusers: any) => {
                  poolchallenge.status_num = poolchallenge.status_num + 1;
                  if (
                    poolchallenge.create_userid.toString() ===
                    cuser._id.toString()
                  ) {
                    poolchallenge.create_userid = cuser._id;
                    poolchallenge.joinUser = true;
                  } else {
                    poolchallenge.opponent_userid = cuser._id;
                    poolchallenge.joinOpponent = true;
                  }
                  poolchallenge.save().then((pppoolchange: any) => {
                    User.findOne({ _id: req.body.uid })
                      .then((users: any) => {
                        res.json({
                          success: true,
                          message: "Connected the Game!",
                          token: generateToken(users),
                        });
                      })
                      .catch((err: any) => {
                        res.json({
                          success: false,
                          message: "error",
                          token: "",
                        });
                      });
                  });
                });
              }
            } else if (poolchallenge.coin_type === 3) {
              if (cuser.money.usdt < poolchallenge.amount) {
                errFlag = true;
                res.json({
                  success: false,
                  message: "Insufficient USDT balance!",
                });
              } else {
                errFlag = false;
                cuser.money.usdt = cuser.money.usdt - poolchallenge.amount;
                cuser.save().then((cusers: any) => {
                  poolchallenge.status_num = poolchallenge.status_num + 1;
                  if (
                    poolchallenge.create_userid.toString() ===
                    cuser._id.toString()
                  ) {
                    poolchallenge.create_userid = cuser._id;
                    poolchallenge.joinUser = true;
                  } else {
                    poolchallenge.opponent_userid = cuser._id;
                    poolchallenge.joinOpponent = true;
                  }
                  poolchallenge.save().then((pppoolchange: any) => {
                    User.findOne({ _id: req.body.uid })
                      .then((users: any) => {
                        res.json({
                          success: true,
                          message: "Connected the Game!",
                          token: generateToken(users),
                        });
                      })
                      .catch((err: any) => {
                        res.json({
                          success: false,
                          message: "error",
                          token: "",
                        });
                      });
                  });
                });
              }
            } else {
              if (cuser.money.cake < poolchallenge.amount) {
                errFlag = true;
                res.json({
                  success: false,
                  message: "Insufficient CAKE balance!",
                });
              } else {
                errFlag = false;
                cuser.money.cake = cuser.money.cake - poolchallenge.amount;
                cuser.save().then((cusers: any) => {
                  poolchallenge.status_num = poolchallenge.status_num + 1;
                  if (
                    poolchallenge.create_userid.toString() ===
                    cuser._id.toString()
                  ) {
                    poolchallenge.create_userid = cuser._id;
                    poolchallenge.joinUser = true;
                  } else {
                    poolchallenge.opponent_userid = cuser._id;
                    poolchallenge.joinOpponent = true;
                  }
                  poolchallenge.save().then((pppoolchange: any) => {
                    User.findOne({ _id: req.body.uid })
                      .then((users: any) => {
                        res.json({
                          success: true,
                          message: "Connected the Game!",
                          token: generateToken(users),
                        });
                      })
                      .catch((err: any) => {
                        res.json({
                          success: false,
                          message: "error",
                          token: "",
                        });
                      });
                  });
                });
              }
            }
          })
          .catch((err: any) => {
            res.json({ success: false, message: err });
          });
      }
    })
    .catch((err: any) => {
      res.json({ success: false, message: err });
    });
};
