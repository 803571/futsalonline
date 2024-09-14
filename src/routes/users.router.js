import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 유효성 검사 (joi) 추가
router.post('/sign-up', async (req, res, next) => {
  const { userId, password, name, age } = req.body;

  try {
    const existingUser = await prisma.accounts.findUnique({
      where: {
        userId: userId,
      },
    });

    // 아이디 중복 체크
    if (existingUser) {
      return res.status(400).json({ errorMessage: '이미 존재하는 아이디입니다.' });
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const signUp = await prisma.$transaction(async (tx) => {
      // 1. 계정 생성
      const newAccount = await tx.accounts.create({
        data: {
          userId: userId,
          password: hashedPassword,
          name: name,
          age: age,
        },
      });

      // 2. 캐시 충전
      await tx.cashDatasets.create({
        data: {
          accountId: +newAccount.accountId,
          amount: 10000,
          type: 'charge',
          description: '회원가입 보너스!',
        },
      });

      return { message: '계정 생성에 성공하셨습니다!', account: newAccount };
    });

    res.status(201).json(signUp);
  } catch (err) {
    next(err);
  }
});

export default router;
