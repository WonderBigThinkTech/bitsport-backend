import { Document } from "mongoose";

/**
 * IDHistory Interface
 * Document class inheritance
 */
export interface IDHistory extends Document {
  userId: string;
  coin: string;
  network: string;
  amount: number;
  address: string;
  index: number;
}

export interface IPreContent extends Document {
  content: string;
}
export interface RefreshTime extends Document {
  time: number;
}

export interface RefPoint extends Document {
  point: number;
}

/**
 * IBugReport Interface
 * Document class inheritance
 */
export interface IBugReport extends Document {
  BugTitle: string;
  BugDescription: string;
  BugReportLink: string;
  status: number;
  ReporterId: string;
  ReportReply: string;
  index: number;
}

/**
 * ITaskSuccess Interface
 * Document class inheritance
 */
export interface ITaskSuccess extends Document {
  taskId: string;
  userId: string;
  reportDate: Date;
  reportDesc: string;
  reportLink: string;
  taskStatus: number;
  statusNote: string;
  getReward: boolean;
  index: number;
}

/**
 * ITask Interface
 * Document class inheritance
 */
export interface ITask extends Document {
  title: string;
  description: string;
  reward: number;
  unit: string;
  status: boolean;
  shared: boolean;
  index: number;
}

/**
 * IToken Interface
 * Document class inheritance
 */
export interface IToken extends Document {
  userId: string;
  token: string;
  createdAt: Date;
}

/**
 * IFarmEarn Interface
 * Document class inheritance
 */
export interface IFarmEarn extends Document {
  content: string;
  startTime: number;
  endTime: number;
  tweetType: string;
  tweetId: string;
  imageLink: string;
  mainContent: string;
}

/**
 * IUser Interface
 * Document class inheritance
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  avatar: string;
  referralId: string;
  referralCnt: number;
  airdropIndex: number;
  refresh: Date;
  myPoint: number;
  money: {
    usdt: number;
    busd: number;
    quest: number;
    bitp: number;
    usd: number;
    cake: number;
  };
  earnMoney: {
    usdt: number;
    busd: number;
    bitp: number;
    cake: number;
    usd: number;
  };
  buy_BitpAddr: {
    privateKey: string;
    address: string;
  };
  address: {
    ether: { privateKey: string; address: string };
    bitcoin: { privateKey: string; address: string };
    tron: { privateKey: string; address: string };
  };
  txcount: {
    usd: number;
    usdt: number;
    busd: number;
    cake: number;
  };
  twitter: {
    twitterName: string;
    twitterId: string;
    twitterAvatar: string;
    twitterScreenName: string;
    twitterScore: number;
    tweetedRef: boolean;
    followed: boolean;
    sharedTweet: boolean;
    tweetStatus: [
      {
        tweetId: string;
        tweetType: number;
        tweetLike: number;
        tweetRetweet: number;
        tweetReply: number;
        tweetQuote: number;
      }
    ];
  };
  tweetStatus: IScore[];
  latestEarnAmount: number;
  latestEarnUnit: string;
  latestPlayedTotalStreak: number;
  latestPlayedCurStreak: number;
  ipAddress: string;
  index: number;
  role: number;
}

export interface IScore {
  farm: number;
  booster: number;
}

export interface IBonus extends Document {
  matrix: number[][];
}

/**
 * IChallenge Interface
 * Document class inheritance
 */
export interface IChallenge extends Document {
  title: string;
  difficulty: number;
  description: string;
  streak: number;
  amount: number;
  qc: number;
  coin_sku: string;
  loss_back: string;
  status: number;
  number_of_players: number;
  played_number_count: number;
  index: number;
}

export interface IFarmChallenge extends Document {
  title: string;
  difficulty: number;
  streak: number;
  amount: number;
  index: number;
}
export interface IPoolChallenge extends Document {
  create_userid: string;
  opponent_userid: string;
  status_num: number;
  coin_type: number;
  amount: number;
  gametype: boolean;
}

export interface IPoolChallengeHistory extends Document {
  challengeid: string;
  game_userid: string;
  game_result: string;
}

export interface IPlayChallenge extends Document {
  user_id: string;
  challenge_id: string;
  current_match: string;
  win_match: string;
  loss_match: string;
  tot_match: string;
  won_challenge: string;
  status: string;
  isFinished: boolean;
  index: number;
}

export interface IPlayedChallenge extends Document {
  user_id: string;
  challenge_id: string;
  start_match: string;
  end_match: string;
  winorloss: string;
  status: number;
  index: number;
}

export interface IHistory extends Document {
  user: string;
  coin: string;
  amount: number;
  address: string;
}

export interface ITransaction extends Document {
  coin: number;
  amount: number;
  address: string;
  user: string;
}

interface IResponse {
  [key: string]: any;
}

interface IWalletResponse {
  address: string | unknown;
  privateKey: string;
  publicKey?: string;
  mnemonic?: string;
  nonce?: number;
  seed?: string;
}

type IBalanceResponse = number | string;

export const response = (args: IResponse) => {
  return args;
};

export const walletResponse = (args: IWalletResponse) => {
  return args;
};

export const balanceResponse = (arg: IBalanceResponse) => {
  return arg;
};
