import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 구단 생성
router.post('/clubs', authMiddleware, async (req, res, next) => {
  try {
    const { nickname } = req.body;
    const { accountId } = req.user;

    // 구단 최대 1개 생성 가능
    const isExistClubs = await prisma.clubs.findFirst({
      where: { accountId },
    });

    if (isExistClubs) {
      return res
        .status(409)
        .json({ message: '이미 구단을 보유하고 있습니다.' });
    }

    // nickname 중복 검사
    const isExistNickname = await prisma.clubs.findFirst({
      where: { nickname },
    });

    if (isExistNickname) {
      return res.status(409).json({ message: '이미 존재하는 닉네임입니다.' });
    }

    const club = await prisma.clubs.create({
      data: {
        accountId: +accountId,
        nickname: nickname,
        starters: {
          FW: '',
          MF: '',
          DF: '',
          GK: '',
        },
        substitutes: {},
      },
    });

    return res.status(201).json({ data: club });
  } catch (err) {
    next(err);
  }
});

// 구단 조회
router.get('/clubs', async (req, res, next) => {
  const clubs = await prisma.clubs.findMany({
    select: {
      clubId: true,
      accountId: true,
      starters: true,
      substitutes: true,
    },
  });

  return res.status(200).json({ data: clubs });
});

// 구단 상세 조회
router.get('/clubs/:clubId', async (req, res, next) => {
  const { clubId } = req.params;

  const club = await prisma.clubs.findFirst({
    where: {
      clubId: +clubId,
    },
    select: {
      clubId: true,
      accountId: true,
      starters: true,
      substitutes: true,
    },
  });

  return res.status(200).json({ data: club });
});

export default router;
