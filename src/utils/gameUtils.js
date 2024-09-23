import jwt from 'jsonwebtoken';
import { calculateStats } from './prismaUtils.js';

let currentAttacker = null;

export async function startGame(port, players, attackerInterval) {
  if (players.length !== 2) return;

  const playerA = players[0];
  const playerB = players[1];

  // 게임 로직을 거쳐 A 유저 공격비율 할당
  let attackProbabilityA = gameLogic(playerA, playerB);

  attackerInterval = setInterval(() => {
    // 공격 랜덤값
    const attackProbability = Math.random();

    // 공격자 선정
    if (attackProbability < attackProbabilityA) {
      currentAttacker = playerA;
    } else {
      currentAttacker = playerB;
    }

    players.forEach((player) => {
      // 플레이어의 JWT 토큰에서 userId 추출
      const userId = jwt.decode(player.token).userId;

      if (player === currentAttacker) {
        player.send(`유저 ${userId} 공격 중!`);
      } else {
        player.send(`유저 ${userId} 수비 중!`);
      }
    });
  }, 3000);

  setTimeout(() => {
    clearInterval(attackerInterval);
    endGame(port, players);
  }, 10 * 1000); // 1분 - 60
}

async function endGame(port, players) {
  players.forEach((player) => {
    player.send(`로비로 돌아갑니다...`);
  });

  setTimeout(() => {
    players.forEach((player) => {
      player.close();
    });

    players = [];
  }, 1000); // 1초 후 종료
}

async function gameLogic(playerA, playerB) {
  // 각 플레이어의 JWT 토큰에서 accountId 추출
  const accountAId = jwt.decode(playerA.token).accountId;
  const accountBId = jwt.decode(playerB.token).accountId;

  // 각 플레이어의 팀 스탯 계산
  const teamAStats = await calculateStats(accountAId);
  const teamBStats = await calculateStats(accountBId);

  if (!teamAStats || !teamBStats) {
    console.error('스탯을 불러오는 중 오류가 발생했습니다.');
    return;
  }

  // 각 팀의 총합 스탯을 계산하여 비교 (모든 스탯 합계)
  const totalStatsA = Object.values(teamAStats).reduce((acc, stat) => acc + stat, 0);
  const totalStatsB = Object.values(teamBStats).reduce((acc, stat) => acc + stat, 0);

  // 공격 비율
  const statsDifference = Math.abs(totalStatsA - totalStatsB);
  let attackProbabilityA = 0.5;
  let attackProbabilityB = 0.5;

  if (totalStatsA > totalStatsB) {
    // A팀이 더 강한 경우 - 차이가 많이 날 경우 90% 제한
    attackProbabilityA = Math.min(0.9, 0.5 + statsDifference / (totalStatsA + totalStatsB));
    attackProbabilityB = 1 - attackProbabilityA;
  } else if (totalStatsB > totalStatsA) {
    // B팀이 더 강한 경우 - 차이가 많이 날 경우 90% 제한
    attackProbabilityB = Math.min(0.9, 0.5 + statsDifference / (totalStatsA + totalStatsB));
    attackProbabilityA = 1 - attackProbabilityB;
  }

  console.log(`유저 ${accountAId} 공격 확률: ${attackProbabilityA * 100}%`);
  console.log(`유저 ${accountBId} 공격 확률: ${attackProbabilityB * 100}%`);

  return attackProbabilityA;
}