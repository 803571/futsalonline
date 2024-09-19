import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 카드 목록 조회
router.get('/cards/', async (req, res, next) => {
  const cards = await prisma.cards.findMany({
    select: {
      cardId: true,
      name: true,
      position: true,
      OVR: true,
    },
    orderBy: {
      OVR: 'desc',
    },
  });

  return res.status(200).json({ data: cards });
});

// 카드 상세 조회
router.get('/cards/:cardId', async (req, res, next) => {
  const { cardId } = req.params;

  const card = await prisma.cards.findFirst({
    where: {
      cardId: +cardId,
    },
    select: {
      cardId: true,
      name: true,
      position: true,
      nationality: true,
      position: true,
      OVR: true,
      PAC: true,
      SHO: true,
      PAS: true,
      DRI: true,
      DEF: true,
      PHY: true,
    },
  });

  return res.status(200).json({ data: card });
});
export default router;
