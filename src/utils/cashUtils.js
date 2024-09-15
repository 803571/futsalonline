import { prisma } from '../utils/prisma/index.js';

// 계정 보유 캐시 불러오기 함수
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

export { getAccountCash };
