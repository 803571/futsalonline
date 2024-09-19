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

  // 포지션 내 최대 OVR
  let minOVR = cards[0].OVR;
  for (let i = 0; i < cards.length; i++) {
    if (minOVR > cards[i].OVR) {
      minOVR = cards[i].OVR;
    }
  }

  // 포지션 내 최소 OVR
  let maxOVR = 0;
  for (let i = 0; i < cards.length; i++) {
    if (maxOVR < cards[i].OVR) {
      maxOVR = cards[i].OVR;
    }
  }

  const difference = maxOVR - minOVR;

  const randomNumber = Math.floor(Math.random() * 100) + 1;

  const cardsOVR = [];

  // 확률에 따른 랜덤한 범위
  // 포지션 하위 100% OVR
  if (randomNumber > 75) {
    cards.map((item) => {
      if (item.OVR >= minOVR) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // 포지션 하위 75% OVR
  if (randomNumber > 50 && randomNumber <= 75) {
    cards.map((item) => {
      if (item.OVR >= minOVR && item.OVR <= minOVR + difference * (3 / 4)) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // 포지션 하위 50% OVR
  if (randomNumber > 25 && randomNumber <= 50) {
    cards.map((item) => {
      if (item.OVR >= minOVR && item.OVR <= minOVR + difference * (2 / 4)) {
        cardsOVR.push(item.cardId);
      }
    });
  }
  // 포지션 하위 25% OVR
  if (randomNumber <= 25) {
    cards.map((item) => {
      if (item.OVR >= minOVR && item.OVR <= minOVR + difference * (1 / 4)) {
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

  return res.status(200).json({
    cardsOVR,
    randomNumber,
    prize,
    balance: spentAccount.cash,
  });
});

export default router;
