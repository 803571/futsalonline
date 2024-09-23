import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

// 전체 랭크 조회 (상위 랭크 조회도 가능)
router.get("/rank", async (req, res, next) => {
  const rank = await prisma.gameRankings.findMany({
    orderBy: { rankScore: "desc" },
  });

  if (!rank) {
    return res
      .status(400)
      .json({ errorMessage: `현재 등록된 랭킹 정보가 없습니다.` });
  }

  // 승률을 업데이트를 해줘야만 한다.
  let winCount = 0;
  for (let key in rank) {
    winCount = 0;
    let { playRecords } = rank[key];
    playRecords = playRecords.split(" ");

    if (playRecords) {
      for (let i = 0; i < playRecords.length; i++) {
        const [vs, result] = playRecords[i].split(",");
        //console.log(result);
        if (result === "win") {
          winCount++;
        }
      }
    }

    await prisma.gameRankings.update({
        data: {
          winningRate: (winCount / playRecords.length) * 100,
        },
        where: {
          rankingId: rank[key].rankingId,
        },
      });
  }

  const newRank = await prisma.gameRankings.findMany({
    select: {
      rankingId: true,
      accountId: true,
      winningRate: true,
      rankScore: true,
      playRecords: true,
    },
     orderBy: {rankScore: "desc" }
  })
  // 정렬 되어 있는 rank에서 key 값을 뽑음 => 순서대로 랭킹 정렬
  let saveRankings = [];

  setTimeout(() => {
    for (let key in newRank) {
      const ranking = +key;
      const rankInfo = newRank[key];
      saveRankings.push([ranking + 1, rankInfo]);
    }
  
    return res.status(200).json({ data: saveRankings });
  },1000)
  
});

router.get("/userRank", authSigninMiddleware, async (req, res, next) => {
  const { accountId } = req.account;

  const Accounts = await prisma.accounts.findFirst({
    where: {
      accountId: accountId,
    },
    select: {
      userId: true,
    },
  });
  const myRank = await prisma.gameRankings.findFirst({
    where: {
      accountId: +accountId,
    },
  });

  const rank = await prisma.gameRankings.findMany({
    select: {
      accountId: true,
      winningRate: true,
      rankScore: true,
      playRecords: true,
    },
    orderBy: { rankScore: "desc" },
  });

  let ranking = 0;
  let saveRankings = [];

  for (let key in rank) {
    const { accountId } = rank[key];

    if (accountId !== myRank.accountId) {
      continue;
    } else {
      ranking = +key;
      saveRankings.push([ranking + 1, Accounts.userId, rank[key]]);
      break;
    }
  }

  console.log(saveRankings[0][1]);
  return res.status(200).json({ data: saveRankings });
});
export default router;
