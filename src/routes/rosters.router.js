import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { getAccountCash } from '../utils/cashUtils.js';

const router = express.Router();

// 로그인 인증 추가
router.post('/gacha/:accountId', async (req, res, next) => {
  const { accountId } = req.params;

  try {
    const account = await prisma.accounts.findUnique({
      where: { accountId: +accountId },
    });

    // 계정 체크
    if (!account) {
      return res.status(404).json({ errorMessage: '해당 계정을 찾을 수 없습니다.' });
    }

    // 보유 캐시 체크
    const accountCash = await getAccountCash(accountId);
    if (accountCash < 1000) {
      return res.status(400).json({ errorMessage: '보유 캐시가 부족합니다.' });
    }

    const gacha = await prisma.$transaction(async (tx) => {
      // 모든 선수 목록 가져오기
      const players = await tx.players.findMany({
        select: {
          playerId: true,
          name: true,
        },
      });

      // 랜덤으로 선수 선택
      const randomPlayer = players[Math.floor(Math.random() * players.length)];

      const existingRoster = await tx.rosters.findFirst({
        where: {
          accountId: account.accountId,
          playerId: randomPlayer.playerId,
        },
      });

      if (existingRoster) {
        // 로스터에 존재 시
        await tx.rosters.update({
          where: { rosterId: existingRoster.rosterId },
          data: { amount: { increment: 1 } },
        });
      } else {
        // 로스터에 없을 시
        await tx.rosters.create({
          data: {
            accountId: account.accountId,
            playerId: randomPlayer.playerId,
            amount: 1,
          },
        });
      }

      // 캐시 차감
      await tx.cashDatasets.create({
        data: {
          accountId: Number(accountId),
          amount: 1000,
          type: 'spend',
          description: 'player gacha',
        },
      });

      const remainingCash = await getAccountCash(accountId);

      return {
        player: randomPlayer,
        remainingCash: remainingCash,
      };
    });

    return res.status(200).json({
      message: '선수 뽑기 성공!',
      player: gacha.player,
      remainingCash: gacha.remainingCash,
    });
  } catch (err) {
    next(err);
  }
});

// 보유 로스터 목록, 로그인 인증 추가
router.get('/rosters/:accountId', async (req, res, next) => {
  const { accountId } = req.params;

  try {
    const account = await prisma.accounts.findUnique({
      where: { accountId: +accountId },
    });

    // 계정 체크
    if (!account) {
      return res.status(404).json({ errorMessage: '해당 계정을 찾을 수 없습니다.' });
    }

    // 로스터 선수 목록 조회
    const rosters = await prisma.rosters.findMany({
      where: { accountId: +accountId },
      include: {
        player: true,
      },
    });

    // response 데이터 형식
    const responsePlayers = rosters.map((roster) => ({
      playerId: roster.player.playerId,
      name: roster.player.name,
      height: roster.player.height,
      weight: roster.player.weight,
      amount: roster.amount,
    }));
    const responseRosters = responsePlayers.sort((a, b) => a.playerId - b.playerId);

    return res.status(200).json({ message: '로스터 선수 목록 조회 성공!', rosters: responseRosters });
  } catch (err) {
    // 오류 처리 미들웨어
    next(err);
  }
});

export default router;
