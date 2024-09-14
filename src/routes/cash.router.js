import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 로그인 인증, 유효성 추가
router.post('/cash/charge/:accountId', async (req, res, next) => {
  const { accountId } = req.params;
  const { amount } = req.body;

  try {
    const account = await prisma.accounts.findUnique({
      where: { accountId: +accountId },
    });

    // 계정 체크
    if (!account) {
      return res.status(404).json({ errorMessage: '해당 계정을 찾을 수 없습니다.' });
    }

    // 금액 체크
    if (!amount || amount <= 0) {
      return res.status(400).json({ errorMessage: '충전할 금액을 제대로 입력해주세요.' });
    }

    const chargeCash = await prisma.cashDatasets.create({
      data: {
        accountId: +accountId,
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

// 로그인 인증 추가
router.get('/cash/get/:accountId', async (req, res, next) => {
  const { accountId } = req.params;

  try {
    const account = await prisma.accounts.findUnique({
      where: { accountId: +accountId },
    });

    // 계정 체크
    if (!account) {
      return res.status(404).json({ errorMessage: '해당 계정을 찾을 수 없습니다.' });
    }

    const accountCash = await getAccountCash(accountId);

    const cashResponse = {
      accountId: accountId,
      cash: accountCash,
    };

    res.status(200).json({ message: '캐시 조회', cash: cashResponse });
  } catch (err) {
    next(err);
  }
});

const getAccountCash = async (accountId) => {
  try {
    const account = await prisma.accounts.findUnique({
      where: { accountId: +accountId },
    });

    // 계정 체크
    if (!account) {
      throw new Error('해당 계정을 찾을 수 없습니다.');
    }

    // 해당 계정 캐시 내역 조회
    const cashDataset = await prisma.cashDatasets.findMany({
      where: { accountId: +accountId },
    });

    // 거래 내역으로 보유 캐시 계산
    const accountCash = cashDataset.reduce((acc, cash) => {
      if (cash.type === 'charge') {
        // 충전 시 +
        return acc + cash.amount;
      } else {
        // 충전 X 시 -
        return acc - cash.amount;
      }
    }, 0);

    return accountCash;
  } catch (err) {
    throw new Error(`errorMessage: ${err.message}`);
  }
};

export default router;
