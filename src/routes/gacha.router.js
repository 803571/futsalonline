import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// FW Pack
router.post('/gacha/fwPack', authMiddleware, async (req, res, next) => {
  const { accountId } = req.user;

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

  // FW 솎아내기
  const forward = await prisma.cards.findMany({
    where: { position: 'FW' },
    select: {
      cardId: true,
      OVR: true,
      name: true,
    },
  });

  const randomNumber = Math.floor(Math.random() * 10);

  const forwardOVR = [];

  // OVR 91
  if (randomNumber === 9) {
    forward.map((item) => {
      if (item.OVR >= 91) {
        forwardOVR.push(item.cardId);
      }
    });
  }
  // OVR 89, 90
  if (randomNumber === 7 || randomNumber === 8) {
    forward.map((item) => {
      if (item.OVR === 89 || item.OVR === 90) {
        forwardOVR.push(item.cardId);
      }
    });
  }
  // OVR 87, 88
  if (randomNumber >= 4 && randomNumber <= 6) {
    forward.map((item) => {
      if (item.OVR === 87 || item.OVR === 88) {
        forwardOVR.push(item.cardId);
      }
    });
  }
  // OVR <= 86
  if (randomNumber <= 3) {
    forward.map((item) => {
      if (item.OVR <= 86) {
        forwardOVR.push(item.cardId);
      }
    });
  }

  if (randomNumber)
    return res.status(200).json({ data: forwardOVR, rr: randomNumber });
});

export default router;
