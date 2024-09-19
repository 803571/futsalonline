import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 회원가입
router.post('/sign-up', async (req, res, next) => {
  try {
    const { id, password, name, age } = req.body;

    // 아이디 중복 검사
    const isExistAccount = await prisma.accounts.findFirst({
      where: { id },
    });

    if (isExistAccount) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    // password 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 계정 생성
    const account = await prisma.accounts.create({
      data: {
        id,
        password: hashedPassword,
        name,
        age,
      },
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// 로그인
router.post('/sign-in', async (req, res, next) => {
  const { id, password } = req.body;

  const account = await prisma.accounts.findFirst({ where: { id } });

  if (!account) {
    return res.status(401).json({ message: '존재하지 않는 계정입니다.' });
  }
  if (!(await bcrypt.compare(password, account.password))) {
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  }

  const token = jwt.sign(
    {
      accountId: account.accountId,
    },
    'custom-secret-key'
  );

  res.cookie('authorization', `Bearer ${token}`);
  return res.status(200).json({ message: '로그인에 성공하였습니다.' });
});

export default router;
