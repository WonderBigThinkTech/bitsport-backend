import { Request, Response, json } from "express";
import Axios from "axios";
import moment from "moment";
import TronWeb from "tronweb";
import Web3 from "web3";
import User from "../models/User";
import History from "../models/Withdraw_history";
import Dhistory from "../models/Deposit_history";

const BigNumber = require("bignumber.js");
import dotenv from "dotenv";
dotenv.config();

import {
  ETHEREUM,
  BNBCHAIN,
  TRON,
  BUSD_TOKEN_ADDRESS_BNB,
  BUSD_TOKEN_ADDRESS_ETH,
  BUSD_TOKEN_ADDRESS_TRON,
  USDT_TOKEN_ADDRESS_BNB,
  USDT_TOKEN_ADDRESS_ETH,
  USDT_TOKEN_ADDRESS_TRON,
  CAKE_TOKEN_ADDRESS_BNB,
  CAKE_TOKEN_ADDRESS_ETH,
  CAKE_TOKEN_ADDRESS_TRON,
  ETHEREUM_TRANSACTION,
  BNBCHAIN_TRANSACTION,
  TRON_TRANSACTION,
  BSC_MAINNET_WEB3PROVIDER,
  ETH_MAINNET_WEB3PROVIDER,
  TRON_MAINNET_WEB3PROVIDER,
} from "../config";
import { generateToken } from "../service/helpers";

import contractApi from "../service/contractApi";

export const getUserInfo = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
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

const withdrawFunc = async (
  web3Provider: string,
  coin_address: string,
  network: string,
  amount: number,
  withdrawAddr: string
) => {
  const web3 = new Web3(web3Provider);
  const contractAbi: any = contractApi;
  const contractInstance = new web3.eth.Contract(contractAbi, coin_address);
  const gasPrice = await web3.eth.getGasPrice();

  let withdrawAmount = new BigNumber(0);
  await contractInstance.methods.decimals().call((error: any, result: any) => {
    if (!error) {
      console.log(`The ${coin_address} token has ${result} decimal places.`);
      withdrawAmount = amount * Math.pow(10, result);
    } else {
      console.error(error);
    }
  });

  const transferFunc = contractInstance.methods.transfer(
    withdrawAddr,
    withdrawAmount.toString()
  );

  transferFunc
    .estimateGas({
      from: process.env.ADMIN_WALLET as string,
    })
    .then((gasAmount: number) => {
      web3.eth.getGasPrice().then(async (gasPrice: any) => {
        const senderPrivateKey = process.env.ADMIN_PRIVATEKEY as string;
        const account = web3.eth.accounts.privateKeyToAccount(senderPrivateKey);
        web3.eth.defaultAccount = account.address;
        const txObject = {
          from: web3.eth.defaultAccount,
          to: coin_address,
          gas: gasAmount,
          gasPrice: gasPrice,
          data: contractInstance.methods
            .transfer(withdrawAddr, withdrawAmount.toString())
            .encodeABI(),
        };
        const signedTx = await web3.eth.accounts.signTransaction(
          txObject,
          senderPrivateKey
        );
        const sentTx = await web3.eth.sendSignedTransaction(
          signedTx.rawTransaction ? signedTx.rawTransaction : ""
        );
        console.log(sentTx);
      });
    });
};

const sendGasFeeTrx = async (
  adminPrivateKey: string,
  userWalletAddress: string,
  gasFee: number
) => {
  const tronWeb = new TronWeb({
    fullNode: "https://api.trongrid.io",
    solidityNode: "https://api.trongrid.io",
    eventServer: "https://api.trongrid.io",
    privateKey: adminPrivateKey,
  });
  const options = {
    feeLimit: 100000000,
    callValue: tronWeb.toSun(gasFee),
    shouldPollResponse: true,
  };
  const transaction = await tronWeb.transactionBuilder.sendTrx(
    userWalletAddress,
    options.callValue
  );
  const signed = await tronWeb.trx.sign(transaction, tronWeb.defaultPrivateKey);
  const receipt = await tronWeb.trx.sendRawTransaction(signed);
  console.log("Transaction sent:", receipt.txid);
};

const sendTokenToAdmin = async (
  userPrivateKey: string,
  adminWalletAddress: string,
  tokenAmount: number,
  contractAddress: string
) => {
  const tronWeb = new TronWeb(
    "https://api.trongrid.io",
    "https://api.trongrid.io",
    "https://api.trongrid.io",
    userPrivateKey
  );

  const { abi } = await tronWeb.trx.getContract(contractAddress);
  const contract = tronWeb.contract(abi.entrys, contractAddress);

  const resp = await contract.methods
    .transfer(adminWalletAddress, tokenAmount * 1000000)
    .send();

  const txInfo = await tronWeb.trx.getTransactionInfo(resp);

  if (txInfo && txInfo.receipt && txInfo.receipt.result === "SUCCESS") {
    console.log("Transaction successful!");
  } else {
    console.error("Transaction failed or not found.");
  }
};

const sendTransaction = async (
  web3_prvider: string,
  coin_address: string,
  tokenAmount: number,
  userWallet: string,
  user_privatekey: string,
  network: string
) => {
  if (network == TRON) {
    await sendGasFeeTrx(
      process.env.TRON_ADMIN_PRIVATEKEY as string,
      userWallet,
      30
    );
    await sendTokenToAdmin(
      user_privatekey,
      process.env.TRON_COLD_ADMIN_WALLET as string,
      tokenAmount,
      coin_address
    );
  } else {
    const web3 = new Web3(web3_prvider);
    const contractAbi: any = contractApi;
    const contractInstance = new web3.eth.Contract(contractAbi, coin_address);
    const gasPrice = await web3.eth.getGasPrice();

    const transferFunc = contractInstance.methods.transfer(
      process.env.COLD_ADMIN_WALLET as string,
      tokenAmount.toString()
    );

    transferFunc.estimateGas({ from: userWallet }).then((gasAmount: number) => {
      web3.eth.getGasPrice().then(async (gasPrice: any) => {
        const totalGasFee = gasAmount * gasPrice;
        const gasvalue = network === BNBCHAIN ? 21000 : 2000000;
        const SingedTransaction = await web3.eth.accounts.signTransaction(
          {
            to: userWallet,
            value: totalGasFee,
            gas: gasvalue,
          },
          process.env.ADMIN_PRIVATEKEY as string
        );
        web3.eth
          .sendSignedTransaction(
            SingedTransaction.rawTransaction
              ? SingedTransaction.rawTransaction
              : ""
          )
          .then(async (receipt) => {
            console.log("gas fee sent:", receipt);
            const userPrivateKey = user_privatekey;
            const account =
              web3.eth.accounts.privateKeyToAccount(userPrivateKey);
            web3.eth.defaultAccount = account.address;
            const txObject = {
              from: web3.eth.defaultAccount,
              to: coin_address,
              gas: gasAmount,
              gasPrice: gasPrice,
              data: contractInstance.methods
                .transfer(
                  process.env.COLD_ADMIN_WALLET as string,
                  tokenAmount.toString()
                )
                .encodeABI(),
            };
            const signedTx = await web3.eth.accounts.signTransaction(
              txObject,
              userPrivateKey
            );
            const sentTx = await web3.eth.sendSignedTransaction(
              signedTx.rawTransaction ? signedTx.rawTransaction : ""
            );
            console.log(sentTx);
          });
      });
    });
  }
};

export const refreshWalletBalance = async (req: Request, res: Response) => {
  User.findById(req.body.user).then(async (user: any) => {
    // await depositTokenFunc(user, "BUSD", ETHEREUM);
    // await depositTokenFunc(user, "USDT", ETHEREUM);
    // await depositTokenFunc(user, "CAKE", ETHEREUM);
    await depositTokenFunc(user, "BUSD", BNBCHAIN);
    await depositTokenFunc(user, "USDT", BNBCHAIN);
    await depositTokenFunc(user, "CAKE", BNBCHAIN);
    // await depositTokenFunc(user, "BUSD", TRON);
    // await depositTokenFunc(user, "USDT", TRON);
    // await depositTokenFunc(user, "CAKE", TRON);

    Dhistory.find({ userId: user.id }).then((models: any) => {
      const depositResult = {
        success: true,
        message: "You've deposited successfully.",
        history: models,
        token: generateToken(user),
      };
      res.json(depositResult);
    });
  });
};

const createDHistory = async (
  userId: string,
  coin: string,
  network: string,
  tokenAmount: number,
  address: string
) => {
  let length = 0;
  await Dhistory.find()
    .countDocuments()
    .then((data: any) => (length = data));
  let model = new Dhistory();
  model.userId = userId;
  model.coin = coin;
  model.network = network;
  model.amount = tokenAmount;
  model.address = address;
  model.index = length + 1;
  await model.save().then(() => {
    console.log("new history saved");
  });
};

const depositTokenFunc = async (user: any, coin: string, network: string) => {
  if (network == ETHEREUM) {
    const filter_address = user?.address.ether.address;
    const private_key = user?.address.ether.privateKey;
    const coin_address =
      coin === "BUSD"
        ? BUSD_TOKEN_ADDRESS_ETH
        : coin === "USDT"
        ? USDT_TOKEN_ADDRESS_ETH
        : CAKE_TOKEN_ADDRESS_ETH;
    const config_url = `api?module=account&action=tokentx&contractaddress=${coin_address}&address=${filter_address}&page=1&offset=10&startblock=0&endblock=99999999&sort=desc&apikey=ABUVDNYMXVENVGYN3FY4BYFEFHB6Y2P1JK`;
    let tokenAmount: number = 0;
    let flag: number = 0;
    let sender = "";
    await Axios.get(`${ETHEREUM_TRANSACTION}/${config_url}`).then(
      async (result) => {
        console.log(result);
        if (result.data.status === "0") {
          const returnValue = { success: false, message: result.data.message };
          return returnValue;
        } else if (result.data.status === "1") {
          console.log("result value", result.data);
          const depositCnt = result.data.result.filter(
            (item: any) =>
              item.to.toLowerCase() === filter_address.toLowerCase()
          ).length;
          if (coin === "BUSD") {
            if (user.txcount.busd == 0) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.busd +=
                (result.data.result[0].value * 1.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.bonus.busd +=
                (result.data.result[0].value * 0.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.txcount.busd = depositCnt;
              user.save();
              User.find({ referralId: user.index }).then(
                (referralUser: any) => {
                  referralUser.map((item: any) => {
                    item.money.busd +=
                      (result.data.result[0].value * 0.05) /
                      Math.pow(10, result.data.result[0].tokenDecimal);
                    item.save();
                  });
                }
              );
            } else if (user.txcount.busd < depositCnt) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.busd +=
                result.data.result[0].value /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.txcount.busd = depositCnt;
              user.save();
            }
          } else if (coin === "USDT") {
            console.log("USDT deposit");
            if (user.txcount.usdt == 0) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.usdt +=
                (result.data.result[0].value * 1.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.bonus.usdt +=
                (result.data.result[0].value * 0.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.txcount.usdt = depositCnt;
              user.save();
              User.find({ referralId: user.index }).then(
                (referralUser: any) => {
                  referralUser.map((item: any) => {
                    item.money.usdt +=
                      (result.data.result[0].value * 0.05) /
                      Math.pow(10, result.data.result[0].tokenDecimal);
                    item.save();
                  });
                }
              );
            } else if (user.txcount.usdt < depositCnt) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.usdt += result.data.result[0].value;
              user.txcount.usdt = depositCnt;
              user.save();
            }
          } else if (coin === "CAKE") {
            if (user.txcount.cake == 0) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.cake +=
                (result.data.result[0].value * 1.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.bonus.cake +=
                (result.data.result[0].value * 0.5) /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.txcount.cake = depositCnt;
              user.save();
              User.find({ referralId: user.index }).then(
                (referralUser: any) => {
                  referralUser.map((item: any) => {
                    item.money.cake +=
                      (result.data.result[0].value * 0.05) /
                      Math.pow(10, result.data.result[0].tokenDecimal);
                    item.save();
                  });
                }
              );
            } else if (user.txcount.cake < depositCnt) {
              flag = 1;
              tokenAmount = result.data.result[0].value;
              user.money.cake +=
                result.data.result[0].value /
                Math.pow(10, result.data.result[0].tokenDecimal);
              user.txcount.cake = depositCnt;
              user.save();
            }
          }

          if (flag) {
            console.log(
              user.id,
              coin,
              network,
              tokenAmount,
              result.data.result[0]
            );
            await createDHistory(
              user.id,
              coin,
              network,
              tokenAmount,
              result.data.result[0].from
            );
            // await sendTransaction(
            //   ETH_MAINNET_WEB3PROVIDER,
            //   coin_address,
            //   tokenAmount,
            //   filter_address,
            //   private_key,
            //   network
            // );
            flag = 0;
          }
        }
      }
    );
  } else if (network === BNBCHAIN) {
    const filter_address = user.address.bitcoin.address;
    const private_key = user.address.bitcoin.privateKey;

    const coin_address =
      coin === "BUSD"
        ? BUSD_TOKEN_ADDRESS_BNB
        : coin === "USDT"
        ? USDT_TOKEN_ADDRESS_BNB
        : CAKE_TOKEN_ADDRESS_BNB;
    const config_url = `api?module=account&action=tokentx&contractaddress=${coin_address}&address=${filter_address}&startblock=0&endblock=999999999&page=1&offset=100&sort=desc&apikey=IHX3A7GFSDN8EFQCK2PA2DAZF8K9BW37M9`;
    let tokenAmount: number = 0;
    let flag: number = 0;
    Axios.get(`${BNBCHAIN_TRANSACTION}/${config_url}`).then(async (result) => {
      if (result.data.status === "0") {
        const returnValue = { success: false, message: result.data.message };
        return returnValue;
      } else if (result.data.status === "1") {
        const depositCnt = result.data.result.filter(
          (item: any) => item.to.toLowerCase() === filter_address.toLowerCase()
        ).length;
        if (coin === "BUSD") {
          if (user.txcount.busd == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.busd +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.busd +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.busd = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.busd +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.busd < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.busd +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.busd = depositCnt;
            user.save();
          }
        } else if (coin === "USDT") {
          if (user.txcount.usdt == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.usdt +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.usdt +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.usdt = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.usdt +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.usdt < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.usdt +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.usdt = depositCnt;
            user.save();
          }
        } else if (coin === "CAKE") {
          if (user.txcount.cake == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.cake +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.cake +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.cake = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.cake +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.cake < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.cake +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.cake = depositCnt;
            user.save();
          }
        }

        if (flag) {
          await createDHistory(
            user.id,
            coin,
            network,
            tokenAmount,
            result.data.result[0].from
          );
          await sendTransaction(
            BSC_MAINNET_WEB3PROVIDER,
            coin_address,
            tokenAmount,
            filter_address,
            private_key,
            network
          );
          flag = 0;
        }
      }
    });
  } else if (network === TRON) {
    const userWalletAddress = user.address.tron.address;
    const private_key = user.address.tron.privateKey;
    const coin_address =
      coin === "BUSD"
        ? BUSD_TOKEN_ADDRESS_TRON
        : coin === "USDT"
        ? USDT_TOKEN_ADDRESS_TRON
        : CAKE_TOKEN_ADDRESS_TRON;

    const config_url = `v1/accounts/${userWalletAddress}/transactions/trc20?limit=100&contract_address=${coin_address}`;
    let tokenAmount: number = 0;
    let flag: number = 0;
    Axios.get(`${TRON_TRANSACTION}/${config_url}`).then(async (result) => {
      if (!result.data.success) {
        const returnValue = { success: false, message: result.data.message };
        return returnValue;
      } else if (result.data.status) {
        const depositCnt = result.data.result.filter(
          (item: any) =>
            item.to.toLowerCase() === userWalletAddress.toLowerCase()
        ).length;
        if (coin === "BUSD") {
          if (user.txcount.busd == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.busd +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.busd +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.busd = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.busd +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.busd < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.busd +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].token_info.decimals);
            user.txcount.busd = depositCnt;
            user.save();
          }
        } else if (coin === "USDT") {
          if (user.txcount.usdt == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.usdt +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.usdt +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.usdt = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.usdt +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.usdt < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.usdt +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].token_info.decimals);
            user.txcount.usdt = depositCnt;
            user.save();
          }
        } else if (coin === "CAKE") {
          if (user.txcount.cake == 0) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.cake +=
              (result.data.result[0].value * 1.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.bonus.cake +=
              (result.data.result[0].value * 0.5) /
              Math.pow(10, result.data.result[0].tokenDecimal);
            user.txcount.cake = depositCnt;
            user.save();

            User.find({ referralId: user.index }).then((referralUser: any) => {
              referralUser.map((item: any) => {
                item.money.cake +=
                  (result.data.result[0].value * 0.05) /
                  Math.pow(10, result.data.result[0].tokenDecimal);
                item.save();
              });
            });
          } else if (user.txcount.cake < depositCnt) {
            flag = 1;
            tokenAmount = result.data.result[0].value;
            user.money.cake +=
              result.data.result[0].value /
              Math.pow(10, result.data.result[0].token_info.decimals);
            user.txcount.cake = depositCnt;
            user.save();
          }
        }
        if (flag) {
          await createDHistory(
            user.id,
            coin,
            network,
            tokenAmount,
            result.data.result[0].from
          );
          await sendTransaction(
            TRON_MAINNET_WEB3PROVIDER,
            coin_address,
            tokenAmount,
            userWalletAddress,
            private_key,
            network
          );
          flag = 0;
        }
      }
    });
  }
};

export const deposit = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      if (req.body.amount) {
        if (user.txcount.usd == 0) {
          user.txcount.usd += 1;
          user.money.usd += Number(req.body.amount) * 1.5;
          user.bonus.usd += Number(req.body.amount) * 0.5;
          user.save();

          User.find({ index: user.referralId }).then((referralUser: any) => {
            referralUser.map((item: any) => {
              item.money.usd += Number(req.body.amount) * 0.05;
              item.save();
            });
          });

          res.json({
            success: true,
            message:
              "You've deposited successfully. You have 50% of deposit bonus",
            token: generateToken(user),
          });
          return;
        } else {
          user.txcount.usd += 1;
          user.money.usd += Number(req.body.amount);
          user.save();
          res.json({
            success: true,
            message: "You've deposited successfully.",
            token: generateToken(user),
          });
          return;
        }
      }
    }
  });
};

export const withdraw = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      let amount = Number(req.body.amount);
      let withdrawAddr = req.body.address;
      let network = req.body.network;
      let coin = req.body.coin;
      let curAmount =
        coin == "BUSD"
          ? user.money.busd
          : coin == "USDT"
          ? user.money.usdt
          : coin == "CAKE"
          ? user.money.cake
          : user.money.usd;
      let curBonus =
        coin == "BUSD"
          ? user.bonus.busd
          : coin == "USDT"
          ? user.bonus.usdt
          : coin == "CAKE"
          ? user.bonus.cake
          : user.money.usd;
      if (curAmount < amount) {
        res.json({
          success: false,
          message: "You have not enough coin to withdraw",
          token: generateToken(user),
        });
      } else if (curAmount - curBonus < amount) {
        res.json({
          success: false,
          message: "Not allowed to withdraw the bonus",
          token: generateToken(user),
        });
      } else {
        if (coin === "USD") {
          user.money.usd -= amount;
        } else if (coin === "BUSD") {
          user.money.busd -= amount;
        } else if (coin === "USDT") {
          user.money.usdt -= amount;
        } else if (coin === "CAKE") {
          user.money.cake -= amount;
        }
        user.save();
        new History({
          user: req.body.user,
          coin,
          amount,
          network,
          address: withdrawAddr,
          status: 0,
        })
          .save()
          .then((res) => console.log(res, 9090))
          .catch((err) => console.log(err));

        res.json({
          success: true,
          message: "You requested to withdraw successfully",
          token: generateToken(user),
        });
      }
      // else {
      //   let coin_address = "";
      //   if (coin == "BUSD") {
      //     user.money.busd -= amount;
      //   } else if (coin == "USDT") {
      //     user.money.usdt -= amount;
      //   } else if (coin == "CAKE") {
      //     user.money.cake -= amount;
      //   }
      //   user.save();
      //   if (network == ETHEREUM) {
      //     coin_address =
      //       coin === "BUSD"
      //         ? BUSD_TOKEN_ADDRESS_ETH
      //         : req.body.coin === "USDT"
      //           ? USDT_TOKEN_ADDRESS_ETH
      //           : CAKE_TOKEN_ADDRESS_ETH;
      //   } else if (network == BNBCHAIN) {
      //     coin_address =
      //       coin === "BUSD"
      //         ? BUSD_TOKEN_ADDRESS_BNB
      //         : req.body.coin === "USDT"
      //           ? USDT_TOKEN_ADDRESS_BNB
      //           : CAKE_TOKEN_ADDRESS_BNB;
      //   } else if (network == TRON) {
      //     coin_address =
      //       coin === "BUSD"
      //         ? BUSD_TOKEN_ADDRESS_TRON
      //         : req.body.coin === "USDT"
      //           ? USDT_TOKEN_ADDRESS_TRON
      //           : CAKE_TOKEN_ADDRESS_TRON;
      //   }

      //   let web3Provider =
      //     network == ETHEREUM
      //       ? ETH_MAINNET_WEB3PROVIDER
      //       : network == BNBCHAIN
      //         ? BSC_MAINNET_WEB3PROVIDER
      //         : TRON_MAINNET_WEB3PROVIDER;
      //   withdrawFunc(web3Provider, coin_address, network, amount, withdrawAddr);

      //   // Save history when user withdraw the money (params: withdrawAddr, coin, amount, user )
      //   new History({
      //     user: req.body.user,
      //     coin,
      //     amount,
      //     address: withdrawAddr,
      //   })
      //     .save()
      //     .then((res) => console.log(res, 9090))
      //     .catch((err) => console.log(err));

      //   res.json({
      //     success: true,
      //     token: generateToken(user),
      //   });
      // }
    }
  });
};

const getTokenBalanceOnBSC = async (
  tokenName: string,
  walletAddress: string
) => {
  let token_addr;
  let decimal = 18;
  if (tokenName == "usdt") token_addr = USDT_TOKEN_ADDRESS_BNB;
  else if (tokenName == "busd") token_addr = BUSD_TOKEN_ADDRESS_BNB;
  const web3 = new Web3(BSC_MAINNET_WEB3PROVIDER);
  const contractAbi: any = contractApi;
  const contract = new web3.eth.Contract(contractAbi, token_addr);
  const token_balance = await contract.methods.balanceOf(walletAddress).call();
  const read_token_balance = (token_balance / 10 ** decimal).toFixed(18);
  return Number(read_token_balance);
};

const getBnbBalance = async (walletAddress: string) => {
  try {
    const web3 = new Web3(BSC_MAINNET_WEB3PROVIDER);
    let bnb_balance = await web3.eth.getBalance(walletAddress);
    bnb_balance = web3.utils.fromWei(bnb_balance);
    return Number(bnb_balance);
  } catch (error) {
    console.log(error);
    return -1;
  }
};

const getGasFeeToSendBnb = async (
  bnb_balance: number,
  walletAddress: string
) => {
  let gasFeeBN;
  const fromAddress = walletAddress;
  const toAddress = process.env.COLD_ADMIN_WALLET;
  const web3 = new Web3(BSC_MAINNET_WEB3PROVIDER);
  const valueToSend = web3.utils.toWei(bnb_balance.toString(), "ether"); // Amount of BNB you want to send

  const transaction = {
    from: fromAddress,
    to: toAddress,
    value: valueToSend,
  };

  await web3.eth.estimateGas(transaction).then(async (gasEstimate) => {
    await web3.eth.getGasPrice().then(async (gasPrice) => {
      const gasFee = web3.utils
        .toBN(gasPrice)
        .mul(web3.utils.toBN(gasEstimate));
      gasFeeBN = web3.utils.fromWei(gasFee, "ether");
    });
  });
  return gasFeeBN;
};

const sendBnb = async (
  fromAddress: string,
  fromPrivateKey: string,
  toAddress: string
) => {
  const web3 = new Web3(BSC_MAINNET_WEB3PROVIDER);
  await web3.eth.getBalance(fromAddress).then(async (balance) => {
    const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
    const gasLimit = web3.utils.toBN(21000); // typical gas limit for a simple transfer
    const gasCost = gasPrice.mul(gasLimit);

    const amountToSend = web3.utils.toBN(balance).sub(gasCost);

    web3.eth.getTransactionCount(fromAddress).then((nonce) => {
      const tx = {
        from: fromAddress,
        to: toAddress,
        value: amountToSend.toString(),
        gas: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        nonce: nonce,
      };

      web3.eth.accounts
        .signTransaction(tx, fromPrivateKey)
        .then((signedTx: any) => {
          web3.eth
            .sendSignedTransaction(signedTx.rawTransaction)
            .on("receipt", console.log);
        });
    });
  });
};

export const buyBITP = async (req: Request, res: Response) => {
  User.findById(req.body.user).then(async (user: any) => {
    if (user) {
      const walletAddress = user.buy_BitpAddr.address;
      const private_key = user.buy_BitpAddr.privateKey;
      const buyCurrency = req.body.buyCurrency;
      if (buyCurrency == "USDT") {
        const usdt_balance = await getTokenBalanceOnBSC("usdt", walletAddress);
        if (usdt_balance == 0) {
          res.json({
            success: false,
            message: `You have 0 USDT in your wallet. Check if Deposit is completely finished.`,
          });
        } else {
          const bitp_balance = usdt_balance / 0.06;
          user.money.bitp += bitp_balance;
          user.save();
          await sendTransaction(
            BSC_MAINNET_WEB3PROVIDER,
            USDT_TOKEN_ADDRESS_BNB,
            usdt_balance * Math.pow(10, 18),
            walletAddress,
            private_key,
            BNBCHAIN
          );
          res.json({
            success: true,
            token: generateToken(user),
            message: `You have successfully bought ${bitp_balance.toFixed(
              6
            )} BITP using ${usdt_balance.toFixed(6)} USDT`,
          });
        }
      } else if (buyCurrency == "BUSD") {
        const busd_balance = await getTokenBalanceOnBSC("busd", walletAddress);
        if (busd_balance == 0) {
          res.json({
            success: false,
            message: `You have 0 BUSD in your wallet. Check if Deposit is completely finished.`,
          });
        } else {
          const bitp_balance = busd_balance / 0.06;
          user.money.bitp += bitp_balance;
          user.save();
          await sendTransaction(
            BSC_MAINNET_WEB3PROVIDER,
            BUSD_TOKEN_ADDRESS_BNB,
            busd_balance * Math.pow(10, 18),
            walletAddress,
            private_key,
            BNBCHAIN
          );
          res.json({
            success: true,
            token: generateToken(user),
            message: `You have successfully bought ${bitp_balance.toFixed(
              6
            )} BITP using ${busd_balance.toFixed(6)} BUSD`,
          });
        }
      } else if (buyCurrency == "BNB") {
        const bnb_balance: number = await getBnbBalance(walletAddress);
        if (bnb_balance == 0) {
          res.json({
            success: false,
            message: `You have 0 BNB in your wallet. Check if Deposit is completely finished.`,
          });
        } else {
          let bitp_balance;
          await Axios.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
          )
            .then((response) => {
              const bnbPriceInUSD = response.data.binancecoin.usd;
              const balanceInUSD = bnb_balance * bnbPriceInUSD;
              bitp_balance = balanceInUSD / 0.06;
              user.money.bitp += bitp_balance;
              user.save();
            })
            .catch((error) => {
              console.error("An error occurred:", error);
            });
          await sendBnb(
            walletAddress,
            private_key,
            process.env.COLD_ADMIN_WALLET as string
          );
          res.json({
            success: true,
            token: generateToken(user),
            message: `You have successfully bought ${bitp_balance.toFixed(
              6
            )} BITP using ${bnb_balance.toFixed(6)} BNB`,
          });
        }
      }
    }
  });
};

export const swap = async (req: Request, res: Response) => {
  User.findById(req.body.user).then((user: any) => {
    if (user) {
      let fromAmount = 0;
      let toAmount = 0;
      switch (req.body.coinFrom) {
        case "BUSD":
          fromAmount = user.money.busd;
          break;
        case "USDT":
          fromAmount = user.money.usdt;
          break;
        case "USD":
          fromAmount = user.money.usd;
          break;
        case "BITP":
          fromAmount = user.money.bitp;
          break;
        case "CAKE":
          fromAmount = user.money.cake;
          break;
      }

      switch (req.body.coinTo) {
        case "BUSD":
          toAmount = user.money.busd;
          break;
        case "USDT":
          toAmount = user.money.usdt;
          break;
        case "USD":
          toAmount = user.money.usd;
          break;
        case "BITP":
          toAmount = user.money.bitp;
          break;
        case "CAKE":
          toAmount = user.money.cake;
          break;
        case "Quest Credit":
          toAmount = user.money.quest;
          break;
      }
      if (fromAmount < req.body.fromTokenAmount) {
        res.json({
          success: false,
          message: "You have not enought token amount to swap",
        });
      } else {
        switch (req.body.coinFrom) {
          case "BUSD":
            user.money.busd -= req.body.fromTokenAmount;
            break;
          case "USDT":
            user.money.usdt -= req.body.fromTokenAmount;
            break;
          case "USD":
            user.money.usd -= req.body.fromTokenAmount;
            break;
          case "BITP":
            user.money.bitp -= req.body.fromTokenAmount;
            break;
          case "CAKE":
            user.money.cake -= req.body.fromTokenAmount;
            break;
        }

        switch (req.body.coinTo) {
          case "BUSD":
            user.money.busd += req.body.toTokenAmount;
            break;
          case "USDT":
            user.money.usdt += req.body.toTokenAmount;
            break;
          case "USD":
            user.money.usd += req.body.toTokenAmount;
            break;
          case "BITP":
            user.money.bitp += req.body.toTokenAmount;
            break;
          case "CAKE":
            user.money.cake += req.body.toTokenAmount;
            break;
          case "Quest Credit":
            user.money.quest += req.body.toTokenAmount;
            break;
        }
        user.save();
        res.json({
          success: true,
          message: "swap successfully done",
        });
      }
    } else {
      res.json({
        success: false,
        message: "user session invalid",
      });
    }
  });
};

export const withdrawHistory = async (req: Request, res: Response) => {
  History.find({ user: req.body.user }).then((history: any) => {
    if (history) {
      res.json({
        success: true,
        history,
      });
    } else {
      res.json({
        success: false,
        message: "No history found",
      });
    }
  });
};

export const withdrawHistoryAdmin = async (req: Request, res: Response) => {
  History.find()
    .populate("user")
    .then((models: any) => {
      res.json({ models });
    });
};

export const remove = async (req: Request, res: Response) => {
  History.findOne({ _id: req.params.id })
    .populate("user")
    .then((model: any) => {
      if (model?.status != 1) {
        if (model.coin === "USD") {
          model.user.money.usd += model.amount;
        } else if (model.coin === "BUSD") {
          model.user.money.busd += model.amount;
        } else if (model.coin === "USDT") {
          model.user.money.usdt += model.amount;
        } else if (model.coin === "CAKE") {
          model.user.money.cake += model.amount;
        }
      }
      model.user.save();
    });
  History.findByIdAndDelete(req.params.id).then((model: any) => {
    res.json({ success: true, model });
  });
};

export const check = async (req: Request, res: Response) => {
  History.findOne({ _id: req.params.id }).then((model: any) => {
    model.status = 1;
    model.save().then(() => {
      History.find()
        .populate("user")
        .then((models: any) => {
          res.json({ success: true, models });
        });
    });
  });
};
