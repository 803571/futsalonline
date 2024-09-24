import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/gacha/:packId', authMiddleware, async (req, res, next) => {
  const { accountId } = req.user;
  const { packId } = req.params;

  const details = await prisma.cashDatasets.create({
    data: {
      accountId,
      amount: 1000,
      type: 'buy',
      description: `${packId}팩 구매`,
    },
  });

  const players = await prisma.players.findMany({
    select: {
      playerId: true,
      name: true,
      PAC: true,
      SHO: true,
      PAS: true,
      DRI: true,
      DEF: true,
      PHY: true,
    },
  });

  // packId stat만 추출
  const stat = players.map((player) => player[packId]);

  const min = Math.min(...stat); // stat 최소값
  const max = Math.max(...stat); // stat 최대값
  const difference = max - min;
  const randomNumber = Math.floor(Math.random() * 100) + 1;

  const statPlayer = [];

  if (randomNumber > 75) {
    players.forEach((player) => {
      if (player[packId] >= min) {
        statPlayer.push(player.playerId);
      }
    });
  }

  if (randomNumber > 50 && randomNumber <= 75)
    players.forEach((player) => {
      if (
        player[packId] >= min &&
        player[packId] <= min + difference * (3 / 4)
      ) {
        statPlayer.push(player.playerId);
      }
    });

  if (randomNumber > 25 && randomNumber <= 50)
    players.forEach((player) => {
      if (
        player[packId] >= min &&
        player[packId] <= min + difference * (2 / 4)
      ) {
        statPlayer.push(player.playerId);
      }
    });

  if (randomNumber <= 25)
    players.forEach((player) => {
      if (
        player[packId] >= min &&
        player[packId] <= min + difference * (1 / 4)
      ) {
        statPlayer.push(player.playerId);
      }
    });

  const randomNumber2 = Math.floor(Math.random() * statPlayer.length);

  const prize = await prisma.rosters.create({
    data: {
      accountId: accountId,
      playerid: statPlayer[randomNumber2],
    },
  });

  return res.status(200).json({
    details,
    accountId,
    statPlayer: statPlayer[randomNumber2],
  });
});

export default router;
