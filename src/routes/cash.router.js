import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { getAccountCash } from '../utils/cashUtils.js'
import authSignIn from '../middlewares/auth.signin.middleware.js';

const router = express.Router();

/**
 * 캐시 충전 API
 * @route POST /cash/charge - 로그인 인증 필요
 * @param {number} amount - 캐시 충전 금액
 * @returns {object} - 성공 or 실패 메시지 / 캐시 충전 정보
 */
router.post('/cash/charge', authSignIn, async (req, res, next) => {
  const { amount } = req.body;
  const account = req.account;

  try {
    // 금액 체크
    if (!amount || amount <= 0) {
      return res.status(400).json({ errorMessage: '충전할 금액을 제대로 입력해주세요.' });
    }

    const chargeCash = await prisma.cashDatasets.create({
      data: {
        accountId: +account.accountId,
        amount: amount,
        type: 'charge',
        description: `${amount} 캐시 충전!`,
      },
    });

    res.status(200).json({ message: '캐시 충전이 완료되었습니다!', charge: chargeCash });
  } catch (err) {
    next(err);
  }
});

/**
 * 캐시 조회 API
 * @route POST /cash/get - 로그인 인증 필요
 * @returns {object} - 성공 or 실패 메시지 / 캐시 조회
 */
router.get('/cash/get', authSignIn, async (req, res, next) => {
  const account = req.account;

  try {
    const accountCash = await getAccountCash(account.accountId);

    const cashResponse = {
      accountId: +account.accountId,
      cash: accountCash,
    };

    res.status(200).json({ message: '캐시 조회', cash: cashResponse });
  } catch (err) {
    next(err);
  }
});

export default router;
