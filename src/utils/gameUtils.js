import jwt from 'jsonwebtoken';
import { calculateStats } from './prismaUtils.js';
import { gameState } from './state/gameState.js';

let currentAttacker = null;

export async function startGame(port, players) {
  if (players.length !== 2) return;

  const playerA = players[0];
  const playerB = players[1];

  // 게임 로직을 거쳐 A 유저 공격비율 할당
  let attackProbabilityA = await gameLogic(playerA, playerB);

  // 스코어
  let scoreA = 0;
  let scoreB = 0;
  let startTime = new Date().toISOString();

  // 3초 인터벌
  gameState.attackerInterval = setInterval(() => {
    // 공격 랜덤값
    const attackProbability = Math.random();

    // 공격자 선정
    currentAttacker = attackProbability < attackProbabilityA ? playerA : playerB;

    players.forEach((player) => {
      // 플레이어의 JWT 토큰에서 userId 추출
      const userId = jwt.decode(player.token).userId;

      if (player === currentAttacker) {
        player.send(`유저 ${userId} 공격 중!`);
      } else {
        player.send(`유저 ${userId} 수비 중!`);
      }
    });

    // 공격 성공 확률
    const goalProbability = Math.random();
    const goalSuccessRate = 0.3;

    if (goalProbability < goalSuccessRate) {
      players.forEach((player) => {
        const userId = jwt.decode(player.token).userId;

        if (player === currentAttacker) {
          // 스코어 계산
          if (player === playerA) {
            scoreA++;
          } else {
            scoreB++;
          }

          player.send(`⚽️ 유저 ${userId} 골!!!`);
        } else {
          player.send(`❌ 유저 ${userId} 실점...`);
        }
      });
    }
  }, 3000);

  setTimeout(async () => {
    clearInterval(gameState.attackerInterval);
    await endGame(port, players, scoreA, scoreB, startTime);
  }, 10 * 1000); // 1분 - 60
}

async function endGame(port, players, scoreA, scoreB, startTime) {
  // 승무패 결정
  let resultA, resultB;
  if (scoreA > scoreB) {
    resultA = 'win';
    resultB = 'lose';
  } else if (scoreA < scoreB) {
    resultA = 'lose';
    resultB = 'win';
  } else {
    resultA = 'draw';
    resultB = 'draw';
  }

  // 스코어 출력
  players.forEach((player) => {
    const userId = jwt.decode(player.token).userId;
    player.send(`경기 종료! 스코어: 유저 ${userId} - ${scoreA} : ${scoreB}`);
  });

  // API 호출을 위한 정보
  const matchResultA = {
    accountId: jwt.decode(players[0].token).accountId,
    opponent: jwt.decode(players[1].token).userId,
    result: resultA,
    startTime: startTime,
    endTime: new Date().toISOString(),
  };

  const matchResultB = {
    accountId: jwt.decode(players[1].token).accountId,
    opponent: jwt.decode(players[0].token).userId,
    result: resultB,
    startTime: startTime,
    endTime: new Date().toISOString(),
  };

  players.forEach((player) => {
    player.send(`로비로 돌아갑니다...`);
  });

  // API 호출
  await Promise.all([
    fetch(`http://54.180.236.142:3333/api/match/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matchResultA),
    }),
    fetch(`http://54.180.236.142:3333/api/match/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matchResultB),
    }),
  ]);

  setTimeout(() => {
    players.forEach((player) => {
      player.close();
    });

    players.length = 0;
  }, 10 * 1000); // 10초 후 종료
}

async function gameLogic(playerA, playerB) {
  // 각 플레이어의 JWT 토큰에서 accountId 추출
  const accountAId = jwt.decode(playerA.token).accountId;
  const accountBId = jwt.decode(playerB.token).accountId;

  // 각 플레이어의 스쿼드 스탯 계산
  const squadAStats = await calculateStats(accountAId);
  const squadBStats = await calculateStats(accountBId);

  if (!squadAStats || !squadBStats) {
    console.error('스탯을 불러오는 중 오류가 발생했습니다.');
    return;
  }

  // 각 스쿼드의 총합 스탯을 계산하여 비교 (모든 스탯 합계)
  const totalStatsA = Object.values(squadAStats).reduce((acc, stat) => acc + stat, 0);
  const totalStatsB = Object.values(squadBStats).reduce((acc, stat) => acc + stat, 0);

  // 공격 비율
  const statsDifference = Math.abs(totalStatsA - totalStatsB);
  let attackProbabilityA = 0.5;
  let attackProbabilityB = 0.5;

  if (totalStatsA > totalStatsB) {
    // A 스쿼드가 더 강한 경우 - 차이가 많이 날 경우 90% 제한
    attackProbabilityA = Math.min(0.9, 0.5 + statsDifference / (totalStatsA + totalStatsB));
    attackProbabilityB = 1 - attackProbabilityA;
  } else if (totalStatsB > totalStatsA) {
    // B 스쿼드가 더 강한 경우 - 차이가 많이 날 경우 90% 제한
    attackProbabilityB = Math.min(0.9, 0.5 + statsDifference / (totalStatsA + totalStatsB));
    attackProbabilityA = 1 - attackProbabilityB;
  }

  console.log(`유저 ${accountAId} 공격 확률: ${attackProbabilityA * 100}%`);
  console.log(`유저 ${accountBId} 공격 확률: ${attackProbabilityB * 100}%`);

  return attackProbabilityA;
}
