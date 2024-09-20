import express from 'express';
import bcrypt from 'bcrypt';
import joi from 'joi';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma/index.js';

dotenv.config();

const router = express.Router();

const info = joi.object({
  userId: joi.string().pattern(new RegExp('^[a-z0-9]{4,10}$')).required(),
  password: joi.string().pattern(new RegExp('^[a-z0-9]{6,15}$')).required(),
});

/**
 * 회원 가입 API
 * @route POST /sign-up
 * @param {string} userId - 사용자 ID
 * @param {string} password - 비밀번호
 * @param {string} passwordCheck - 비밀번호 확인
 * @param {string} name - 이름
 * @param {number} age - 나이
 * @returns {object} - 성공 or 실패 메시지 / 계정 정보(비밀번호 암호화)
 */
router.post('/sign-up', async (req, res, next) => {
  const { userId, password, passwordCheck, name, age } = req.body;

  try {
    // 유효성 체크
    try {
      await info.validateAsync({ userId, password });
    } catch (err) {
      return res.status(400).json({ errorMessage: '유효한 아이디, 비밀번호를 입력해주세요.' });
    }

    const existingUser = await prisma.accounts.findUnique({
      where: {
        userId: userId,
      },
    });

    // 아이디 중복 체크
    if (existingUser) {
      return res.status(400).json({ errorMessage: '이미 존재하는 아이디입니다.' });
    }

    // 비밀번호 확인 검사
    if (!passwordCheck) {
      return res.status(400).json({ errorMessage: '비밀번호 확인을 입력해주세요.' });
    }
    if (password !== passwordCheck) {
      return res.status(400).json({ errorMessage: '비밀번호 확인이 일치하지 않습니다.' });
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

/**
 * 로그인 API
 * @route POST /sign-in
 * @param {string} userId - 사용자 ID
 * @param {string} password - 비밀번호
 * @returns {object} - 성공 or 실패 메시지 / JWT 토큰
 */
router.post('/sign-in', async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    const account = await prisma.accounts.findFirst({ where: { userId } });

    if (!account) return res.status(401).json({ errorMessage: '존재하지 않는 아이디입니다.' });
    // 전달 받은 함호화된 비밀번호를 토대로 복호화하여 비밀번호 일치 여부 확인.
    if (!(await bcrypt.compare(password, account.password))) return res.status(401).json({ errorMessage: '비밀번호가 일치하지 않습니다.' });

    // JWT 생성
    const payload = {
      accountId: account.accountId,
      userId: account.userId,
    };

    // 엑세스 토큰 생성
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    // 로그인 성공 및 엑세스 토큰 반환
    return res.status(200).json({ message: '로그인에 성공하였습니다.', token });
  } catch (err) {
    // 에러 처리 미들웨어
    next(err);
  }
});

export default router;
