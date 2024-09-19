import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/gacha/:packId', authMiddleware, async (req, res, next) => {
  const { accountId } = req.user;
  const { packId } = req.params;

  const account = await prisma.accounts.findFirst({ where: { accountId } });

  if (account.cash < 1000) {
    return res.status(400).json({ message: '보유 캐시가 부족합니다.' });
  }

  // cash 차감
  const spentAccount = await prisma.accounts.update({
    where: {
      accountId,
    },
    data: {
      cash: account.cash - 1000,
    },
  });

  // 포지션 구분해서 담기
  const cards = await prisma.cards.findMany({
    where: { position: packId },
    select: {
      cardId: true,
      OVR: true,
      name: true,
    },
  });

  const randomNumber = Math.floor(Math.random() * 10);

  const cardsOVR = [];

  // 확률에 따른 랜덤한 범위
  // OVR 91 // 10%
  if (randomNumber === 9) {
    cards.map((item) => {
      if (item.OVR >= 91) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // OVR 89, 90 // 20%
  if (randomNumber === 7 || randomNumber === 8) {
    cards.map((item) => {
      if (item.OVR === 89 || item.OVR === 90) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // OVR 87, 88 // 30%
  if (randomNumber >= 4 && randomNumber <= 6) {
    cards.map((item) => {
      if (item.OVR === 87 || item.OVR === 88) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // OVR <= 86 // 40%
  if (randomNumber <= 3) {
    cards.map((item) => {
      if (item.OVR <= 86) {
        cardsOVR.push(item.cardId);
      }
    });
  }

  // OVR 범위 내에서 랜덤한 선수
  const randomNumber2 = Math.floor(Math.random() * cardsOVR.length);

  const prize = await prisma.cards.findFirst({
    where: { cardId: cardsOVR[randomNumber2] },
    select: {
      cardId: true,
      OVR: true,
      name: true,
    },
  });

  if (randomNumber)
    return res
      .status(200)
      .json({ data: cardsOVR, randomNumber, packId, prize: prize });
});

export default router;
