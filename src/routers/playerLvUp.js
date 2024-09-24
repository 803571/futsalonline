import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.put("/LvUp/:playerId/:level", authSigninMiddleware, async (req, res, next) => {
  const { accountId } = req.account;
  const { playerId, level } = req.params;

  // 카드의 레벨에 따라서 돈을 소모하여 강화하는 형식
  const roster = await prisma.rosters.findFirst({
    where: {
      accountId: accountId,
      playerId: +playerId,
      level: +level,
    },
  });

  if (!roster) {
    return res
      .status(400)
      .json({ errorMessage: `로스터에 강화할 카드가 존재하지 않습니다.` });
  }

  const player = await prisma.players.findFirst({
    where: {
      playerId: roster.playerId,
    },
  });

  const randomDiv = Math.floor(Math.random() * (10 - 1 + 1) + 1);
  const failEP = ((roster.level + 1 % 5) === 0)? Math.floor(roster.level * 10 / randomDiv): Math.floor(roster.level * 10 / 2); 
  const randomEP = Math.floor((Math.random() * (100 - 1 + 1)) + 1); // 1 ~ 100 중 랜덤,
  
  if(randomEP < failEP) {
     // 강화에 실패하였습니다.
     const cashDatasets = await prisma.cashDatasets.create({
      data: {
        accountId: roster.accountId,
        amount: (roster.level + 1) * 300,
        type: "enhance",
        description: `Fail enhance ${player.name} to LV.${roster.level + 1}`,
      },
    });
     return res.status(200).json({message: `${cashDatasets.amount}를 소모하였으나 ${player.name}의 LV.${roster.level + 1}의 강화에 실패하였습니다.`});
  }
  else {
    const [newRoster, cashDatasets] = await prisma.$transaction(async (tx) => {
      const newRoster = await tx.rosters.update({
        data: {
          level: roster.level + 1,
        },
        where: {
          rosterId: roster.rosterId,
        },
      });
  
      const cashDatasets = await tx.cashDatasets.create({
        data: {
          accountId: roster.accountId,
          amount: (roster.level + 1) * 300,
          type: "enhance",
          description: `enhance ${player.name} to LV.${roster.level + 1}`,
        },
      });
  
      return [newRoster, cashDatasets];
    });
  
    return res.status(200).json({
      message: `${cashDatasets.amount}를 소모하여 ${player.name}가 LV.${newRoster.level}로 강화되었습니다.`,
    });
  }
});

export default router;
