import { prisma } from './prisma/index.js';

export async function getSquads(accountId) {
  try {
    const squads = await prisma.squads.findMany({
      where: { accountId: +accountId },
    });

    return squads;
  } catch (err) {
    console.error('스쿼드 조회 오류:', err);
    return [];
  }
}

// rankScore 가져오는 로직
export async function getRankScores(waitingList) {
  const rankScores = await Promise.all(
    waitingList.map(async (player) => {
      const ranking = await prisma.gameRankings.findUnique({
        where: {
          accountId: +player.accountId,
        },
        select: {
          rankScore: true,
        },
      });
      return {
        player,
        rankScore: ranking ? ranking.rankScore : null,
      };
    })
  );

  return rankScores.filter((rank) => rank.rankScore !== null);
}

export async function calculateStats(accountId) {
  try {
    const squadPlayers = await prisma.squads.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (squadPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const totalStats = {
      PAC: 0,
      SHO: 0,
      PAS: 0,
      DRI: 0,
      DEF: 0,
      PHY: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    squadPlayers.forEach((squad) => {
      // 스쿼드에 포함된 선수
      const player = squad.player;

      totalStats.PAC += player.PAC;
      totalStats.SHO += player.SHO;
      totalStats.PAS += player.PAS;
      totalStats.DRI += player.DRI;
      totalStats.DEF += player.DEF;
      totalStats.PHY += player.PHY;
    });

    return totalStats;
  } catch (err) {
    console.error('스탯 계산 중 오류 발생:', err);
    return null;
  }
}

export async function calculateAttackStats(accountId) {
  try {
    const squadPlayers = await prisma.squads.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (squadPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const attackStats = {
      PAC: 0,
      SHO: 0,
      PAS: 0,
      DRI: 0,
      DEF: 0,
      PHY: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    squadPlayers.forEach((squad) => {
      // 스쿼드에 포함된 선수
      const player = squad.player;

      attackStats.PAC += player.PAC * 0.2;
      attackStats.SHO += player.SHO * 0.3;
      attackStats.PAS += player.PAS * 0.15;
      attackStats.DRI += player.DRI * 0.2;
      attackStats.DEF += player.DEF * 0.05;
      attackStats.PHY += player.PHY * 0.1;
    });

    return attackStats;
  } catch (err) {
    console.error('공격 스탯 계산 중 오류 발생:', err);
    return null;
  }
}

export async function calculateDefenseStats(accountId) {
  try {
    const squadPlayers = await prisma.squads.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (squadPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const defenseStats = {
      PAC: 0,
      SHO: 0,
      PAS: 0,
      DRI: 0,
      DEF: 0,
      PHY: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    squadPlayers.forEach((squad) => {
      // 스쿼드에 포함된 선수
      const player = squad.player;

      defenseStats.PAC += player.PAC * 0.15;
      defenseStats.SHO += player.SHO * 0.05;
      defenseStats.PAS += player.PAS * 0.1;
      defenseStats.DRI += player.DRI * 0.05;
      defenseStats.DEF += player.DEF * 0.4;
      defenseStats.PHY += player.PHY * 0.25;
    });

    return defenseStats;
  } catch (err) {
    console.error('수비 스탯 계산 중 오류 발생:', err);
    return null;
  }
}
