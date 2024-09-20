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
      name: true,
      PAC: true,
      SHO: true,
      PAS: true,
      DRI: true,
      DEF: true,
      PHY: true,
    },
  });

  let stat = [];
  if (packId === 'FW') {
    stat = cards.map((item) => item.PAC + item.SHO);
  }

  if (packId === 'MF') {
    stat = cards.map((item) => item.PAS + item.DRI);
  }

  if (packId === 'DF') {
    stat = cards.map((item) => item.DEF + item.PHY);
  }
  const min = Math.min(...stat);
  const max = Math.max(...stat);
  const difference = max - min;

  const randomNumber = Math.floor(Math.random() * 100) + 1;
  const cardsOVR = [];

  if (packId === 'FW') {
    if (randomNumber > 75) {
      cards.forEach((item) => {
        if (item.PAC + item.SHO >= min) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 75%
    if (randomNumber > 50 && randomNumber <= 75) {
      cards.forEach((item) => {
        if (
          item.PAC + item.SHO >= min &&
          item.PAC + item.SHO <= min + difference * (3 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 50%
    if (randomNumber > 25 && randomNumber <= 50) {
      cards.forEach((item) => {
        if (
          item.PAC + item.SHO >= min &&
          item.PAC + item.SHO <= min + difference * (2 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 25%
    if (randomNumber <= 25) {
      cards.forEach((item) => {
        if (
          item.PAC + item.SHO >= min &&
          item.PAC + item.SHO <= min + difference * (1 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
  }

  if (packId === 'MF') {
    if (randomNumber > 75) {
      cards.forEach((item) => {
        if (item.PAS + item.DRI >= min) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 75%
    if (randomNumber > 50 && randomNumber <= 75) {
      cards.forEach((item) => {
        if (
          item.PAS + item.DRI >= min &&
          item.PAS + item.DRI <= min + difference * (3 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 50%
    if (randomNumber > 25 && randomNumber <= 50) {
      cards.forEach((item) => {
        if (
          item.PAS + item.DRI >= min &&
          item.PAS + item.DRI <= min + difference * (2 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 25%
    if (randomNumber <= 25) {
      cards.forEach((item) => {
        if (
          item.PAS + item.DRI >= min &&
          item.PAS + item.DRI <= min + difference * (1 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
  }

  if (packId === 'DF') {
    if (randomNumber > 75) {
      cards.forEach((item) => {
        if (item.DEF + item.PHY >= min) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 75%
    if (randomNumber > 50 && randomNumber <= 75) {
      cards.forEach((item) => {
        if (
          item.DEF + item.PHY >= min &&
          item.DEF + item.PHY <= min + difference * (3 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 50%
    if (randomNumber > 25 && randomNumber <= 50) {
      cards.forEach((item) => {
        if (
          item.DEF + item.PHY >= min &&
          item.DEF + item.PHY <= min + difference * (2 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
    // // 포지션 하위 25%
    if (randomNumber <= 25) {
      cards.forEach((item) => {
        if (
          item.DEF + item.PHY >= min &&
          item.DEF + item.PHY <= min + difference * (1 / 4)
        ) {
          cardsOVR.push(item.cardId);
        }
      });
    }
  }

  const randomNumber2 = Math.floor(Math.random() * cardsOVR.length);

  const prize = await prisma.cards.findFirst({
    where: { cardId: cardsOVR[randomNumber2] },
    select: {
      cardId: true,
      name: true,
      PAC: true,
      SHO: true,
      PAS: true,
      DRI: true,
      DEF: true,
      PHY: true,
    },
  });

  return res.status(200).json({
    card: prize,
    balance: spentAccount.cash,
  });
});

export default router;
