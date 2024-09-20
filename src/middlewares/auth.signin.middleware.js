import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 로그인(sign-in) 검증
 * @param {*} req
 * @param {*} res
 * @param {*} next - 다음 미들웨어
 */
export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ errorMessage: 'Authorization 헤더가 제공되지 않았습니다.' });
    }

    // jwt 체크
    const [tokentype, token] = authorization.split(' ');
    if (tokentype !== 'Bearer') {
      throw new Error('Token Type이 Bearer 형식이 아닙니다.');
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const accountId = decodedToken.accountId;

    // 계정 체크
    const account = await prisma.accounts.findFirst({
      where: {
        accountId: +accountId,
      },
    });

    if (!account) {
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    if (!account) throw new Error('토큰 사용자가 존재하지 않습니다.');

    req.account = account;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ errorMessage: '토큰이 만료되었습니다.' });
    if (err.name === 'JsonWebTokenError')
      return res.status(401).json({ errorMessage: '토큰이 조작되었습니다.' });

    return res.status(400).json({ errorMessage: err.message });
  }
}
