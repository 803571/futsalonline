import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';
import { getAccountCash } from '../utils/cashUtils.js';
import authSignIn from '../middlewares/auth.signin.middleware.js';

const router = express.Router();

/**
 * 선수팩 뽑기 API - 로그인 인증 필요
 * @route POST /gacha/:packId
 * @param {string} - packId (PAC, SHO, PAS, DRI, DEF, PHY)
 * @returns {object} - 성공 or 실패 메시지 / 선수 정보
 */
router.post('/gacha/:packId', authSignIn, async (req, res, next) => {
  const { packId } = req.params;
  const account = req.account;

  try {
    // 보유 캐시 체크
    const accountCash = await getAccountCash(account.accountId);
    if (accountCash < 1000) {
      return res.status(400).json({ errorMessage: '보유 캐시가 부족합니다.' });
    }

    const gacha = await prisma.$transaction(
      async (tx) => {
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
            if (player[packId] >= min && player[packId] <= min + difference * (3 / 4)) {
              statPlayer.push(player.playerId);
            }
          });
        // packId 스탯기반 하위 50%
        if (randomNumber > 25 && randomNumber <= 50)
          players.forEach((player) => {
            if (player[packId] >= min && player[packId] <= min + difference * (2 / 4)) {
              statPlayer.push(player.playerId);
            }
          });
        // packId 스탯기반 하위 25%
        if (randomNumber <= 25)
          players.forEach((player) => {
            if (player[packId] >= min && player[packId] <= min + difference * (1 / 4)) {
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

        console.log(statPlayer[randomNumber2]);
        // 로스터에 선수 추가
        const getPlayer = await tx.rosters.create({
          data: {
            accountId: +account.accountId,
            playerId: statPlayer[randomNumber2],
            level: 1,
          },
        });

        // 캐시 차감
        const details = await tx.cashDatasets.create({
          data: {
            accountId: +account.accountId,
            amount: 1000,
            type: 'spend',
            description: `${packId}팩 구매`,
          },
        });

        return {
          player: getPlayer,
          details: details,
          prize: prize,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(200).json({
      message: '선수 뽑기 성공!',
      player: gacha.player,
      details: gacha.details,
      prize: gacha.prize,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 로스터 목록 조회 API - 로그인 인증 필요
 * @route GET /rosters
 * @returns {object} - 성공/실패 메시지, 로스터 보유 목록
 */
router.get('/rosters', authSignIn, async (req, res, next) => {
  const account = req.account;

  try {
    // 로스터 선수 목록 조회
    const rosters = await prisma.rosters.findMany({
      where: { accountId: +account.accountId },
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
      level: roster.level,
    }));
    const responseRosters = responsePlayers.sort((a, b) => a.playerId - b.playerId);

    return res.status(200).json({ message: '로스터 선수 목록 조회 성공!', rosters: responseRosters });
  } catch (err) {
    // 오류 처리 미들웨어
    next(err);
  }
});

/**
 * 선수 강화 API - 로그인 인증 필요
 * @route PUT /LvUp/:playerId/:level
 * @returns {object} - 성공/실패 메시지(선수 + 강화)
 */
router.put("/LvUp/:playerId/:level", authSignIn, async (req, res, next) => {
  const { accountId } = req.account;
  const { playerId, level } = req.params;

  // 카드의 레벨에 따라서 돈을 소모하여 강화하는 형식
  const roster = await prisma.rosters.findFirst({
    where: {
      accountId: accountId,
      playerId: +playerId,
      level: +level,
    },
  });

  if (!roster) {
    return res
      .status(400)
      .json({ errorMessage: `로스터에 강화할 카드가 존재하지 않습니다.` });
  }

  const player = await prisma.players.findFirst({
    where: {
      playerId: roster.playerId,
    },
  });

  const randomDiv = Math.floor(Math.random() * (10 - 1 + 1) + 1);
  const failEP = ((roster.level + 1) % 5 === 0)? Math.floor(100 / randomDiv): Math.floor(100 / 2); 
  const randomEP = Math.floor((Math.random() * (100 - 1 + 1)) + 1); // 1 ~ 100 중 랜덤,
  
  console.log(failEP);
  console.log(randomEP);
  if(randomEP < failEP) {
     // 강화에 실패하였습니다.
     const cashDatasets = await prisma.cashDatasets.create({
      data: {
        accountId: roster.accountId,
        amount: (roster.level + 1) * 300,
        type: "enhance",
        description: `Fail enhance ${player.name} to LV.${roster.level + 1}`,
      },
    });
     return res.status(200).json({message: `${cashDatasets.amount}를 소모하였으나 ${player.name}의 LV.${roster.level + 1}의 강화에 실패하였습니다.`});
  }
  else {
    const [newRoster, cashDatasets] = await prisma.$transaction(async (tx) => {
      const newRoster = await tx.rosters.update({
        data: {
          level: roster.level + 1,
        },
        where: {
          rosterId: roster.rosterId,
        },
      });
  
      const cashDatasets = await tx.cashDatasets.create({
        data: {
          accountId: roster.accountId,
          amount: (roster.level + 1) * 300,
          type: "enhance",
          description: `enhance ${player.name} to LV.${roster.level + 1}`,
        },
      });
  
      return [newRoster, cashDatasets];
    });
  
    return res.status(200).json({
      message: `${cashDatasets.amount}를 소모하여 ${player.name}가 LV.${newRoster.level}로 강화되었습니다.`,
    });
  }
});

export default router;
