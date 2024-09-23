import { prisma } from './prisma/index.js';

export async function getClubs(accountId) {
  try {
    const clubs = await prisma.teams.findMany({
      where: { accountId: +accountId },
    });

    return clubs;
  } catch (err) {
    console.error('팀 조회 오류:', err);
    return [];
  }
}

export async function calculateStats(accountId) {
  try {
    const teamPlayers = await prisma.teams.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (teamPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const totalStats = {
      speed: 0,
      acceleration: 0,
      shootingFinish: 0,
      shootingPower: 0,
      pass: 0,
      defense: 0,
      stamina: 0,
      agility: 0,
      balance: 0,
      gk: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    teamPlayers.forEach((team) => {
      // 스쿼드에 포함된 선수
      const player = team.player;

      totalStats.speed += player.speed;
      totalStats.acceleration += player.acceleration;
      totalStats.shootingFinish += player.shootingFinish;
      totalStats.shootingPower += player.shootingPower;
      totalStats.pass += player.pass;
      totalStats.defense += player.defense;
      totalStats.stamina += player.stamina;
      totalStats.agility += player.agility;
      totalStats.balance += player.balance;
      totalStats.gk += player.gk;
    });

    return totalStats;
  } catch (err) {
    console.error('스탯 계산 중 오류 발생:', err);
    return null;
  }
}

export async function calculateAttackStats(accountId) {
  try {
    const teamPlayers = await prisma.teams.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (teamPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const attackStats = {
      speed: 0,
      acceleration: 0,
      shootingFinish: 0,
      shootingPower: 0,
      stamina: 0,
      agility: 0,
      balance: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    teamPlayers.forEach((team) => {
      // 스쿼드에 포함된 선수
      const player = team.player;

      attackStats.speed += player.speed;
      attackStats.acceleration += player.acceleration;
      attackStats.shootingFinish += player.shootingFinish;
      attackStats.shootingPower += player.shootingPower;
      attackStats.stamina += player.stamina;
      attackStats.agility += player.agility;
      attackStats.balance += player.balance;
    });

    return attackStats;
  } catch (err) {
    console.error('공격 스탯 계산 중 오류 발생:', err);
    return null;
  }
}

export async function calculateDefenseStats(accountId) {
  try {
    const teamPlayers = await prisma.teams.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    if (teamPlayers.length === 0) {
      console.error('선수를 찾을 수 없습니다.');
      return null;
    }

    const defenseStats = {
      speed: 0,
      acceleration: 0,
      defense: 0,
      stamina: 0,
      agility: 0,
      balance: 0,
    };

    // 스쿼드 모든 선수의 스탯을 합산
    teamPlayers.forEach((team) => {
      // 스쿼드에 포함된 선수
      const player = team.player;

      defenseStats.speed += player.speed;
      defenseStats.acceleration += player.acceleration;
      defenseStats.defense += player.defense;
      defenseStats.stamina += player.stamina;
      defenseStats.agility += player.agility;
      defenseStats.balance += player.balance;
    });

    return defenseStats;
  } catch (err) {
    console.error('수비 스탯 계산 중 오류 발생:', err);
    return null;
  }
}
