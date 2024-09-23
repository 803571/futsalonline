import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.put("/LvUp/:playerId", authSigninMiddleware, async (req, res, next) => {
  const { accountId } = req.account;
  const { playerId } = req.params;

  // 동일한 카드가 2장 있다면 강화하는 형식
  const roster = await prisma.rosters.findFirst({
    where: {
      accountId: accountId,
      playerId: +playerId,
    },
  });

  if (!roster) {
    return res
      .status(400)
      .json({ errorMessage: `로스터에 존재하지 않습니다.` });
  }

  if (roster.amount <= 2) {
    return res
      .status(400)
      .json({ errorMessage: `강화에 필요한 카드 수가 모자랍니다.` });
  }

  const player = await prisma.players.findFirst({
    where: {
      playerId: roster.playerId,
    },
  });

  // 카드가 최소 3장 이상일 때
  const [newRoster, cashDatasets] = await prisma.$transaction(async (tx) => {
    const newRoster = await tx.rosters.update({
      // 카드를 2장 소모하고 레벨을 하나 올림
      data: {
        playerLv: roster.playerLv + 1,
        amount: roster.amount - 2,
      },
      where: {
        rosterId: roster.rosterId,
      },
    });

    const cashDatasets = await tx.cashDatasets.create({
      data: {
        accountId: roster.accountId,
        amount: (roster.playerLv + 1) * 300,
        type: "enhance",
        description: `enhance ${player.name} to LV.${roster.playerLv + 1}`,
      },
    });

    return [newRoster, cashDatasets];
  });

  return res.status(200).json({
    message: `${cashDatasets.amount}를 소모하여 ${player.name}의 LV이 ${newRoster.playerLv}로 강화되었습니다.`,
  });
});

export default router;
