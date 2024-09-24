import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

router.post('/gacha/:packId', authMiddleware, async (req, res, next) => {
  const { accountId } = req.user;
  const { packId } = req.params;

  // 여기는 캐시데이터 삽입!!
  const [details, getPlayer, prize] = await prisma.$transaction(
    async (tx) => {
      const details = await tx.cashDatasets.create({
        data: {
          accountId, // 누군지
          amount: 1000, // 얼마?
          type: 'buy', // 거래유형
          description: `${packId}팩 구매`, // 뭐샀는지
        },
      });
      // details에담기

      // 선수 불러오기 (실제 게임이라면 선수가 계속 추가되고 삭제되니까 항상 불러와야하니까)
      const players = await tx.players.findMany({
        select: {
          playerId: true,
          name: true,
          PAC: true,
          SHO: true,
          PAS: true,
          DRI: true,
          DEF: true,
          PHY: true,
        },
      });

      // packId에 해당하는 stat만 추출
      const stat = players.map((player) => player[packId]);

      const min = Math.min(...stat); // stat 최소값
      const max = Math.max(...stat); // stat 최대값
      const difference = max - min; // stat 차이값
      const randomNumber = Math.floor(Math.random() * 100) + 1; // 난수생성

      const statPlayer = [];

      // 25% 확률로 전체 선수에서 packId에 해당하는 stat의 최솟값 + 차이값(4분의 1/ 2/ 3/ 4)

      // packId 스탯기반 하위 100%
      if (randomNumber > 75) {
        players.forEach((player) => {
          if (player[packId] >= min) {
            statPlayer.push(player.playerId);
          }
        });
      }
      // packId 스탯기반 하위 75%
      if (randomNumber > 50 && randomNumber <= 75)
        players.forEach((player) => {
          if (
            player[packId] >= min &&
            player[packId] <= min + difference * (3 / 4)
          ) {
            statPlayer.push(player.playerId);
          }
        });
      // packId 스탯기반 하위 50%
      if (randomNumber > 25 && randomNumber <= 50)
        players.forEach((player) => {
          if (
            player[packId] >= min &&
            player[packId] <= min + difference * (2 / 4)
          ) {
            statPlayer.push(player.playerId);
          }
        });
      // packId 스탯기반 하위 25%
      if (randomNumber <= 25)
        players.forEach((player) => {
          if (
            player[packId] >= min &&
            player[packId] <= min + difference * (1 / 4)
          ) {
            statPlayer.push(player.playerId);
          }
        });

      // 스탯기반으로 담은 선수들을 다시 한번 더 랜덤확률로 획득
      const randomNumber2 = Math.floor(Math.random() * statPlayer.length);

      // 당첨된 선수 정보
      const prize = await tx.players.findFirst({
        where: { playerId: statPlayer[randomNumber2] },
        select: {
          name: true,
          PAC: true,
          SHO: true,
          PAS: true,
          DRI: true,
          DEF: true,
          PHY: true,
        },
      });

      // rosters에 선수 넣어주기
      const getPlayer = await tx.rosters.create({
        data: {
          accountId: accountId,
          playerId: statPlayer[randomNumber2],
        },
      });

      return [details, getPlayer, prize];
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
  return res.status(200).json({
    details,
    getPlayer,
    prize,
  });
});

export default router;
