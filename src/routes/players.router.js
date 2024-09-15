import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/**
 * 선수 목록 조회 API
 * @route GET /players
 * @returns {object} - 선수 이름, 키, 몸무게, 가장 높은 능력치 3개
 */
router.get('/players', async (req, res, next) => {
  try {
    const players = await prisma.players.findMany({
      select: {
        // 이름 및 능력치 불러오기
        name: true,
        height: true,
        weight: true,
        speed: true,
        acceleration: true,
        shootingFinish: true,
        shootingPower: true,
        pass: true,
        defense: true,
        stamina: true,
        agility: true,
        balance: true,
        gk: true,
      },
      orderBy: {
        // 플레이어 ID로 정렬
        playerId: 'asc',
      },
    });

    // 플레이어 이름, 가장 높은 스탯 3개
    const playersWithMaxStats = players.map((player) => ({
      name: player.name,
      height: player.height,
      weight: player.weight,
      maxStats: getMaxStats(player),
    }));

    return res.status(200).json({ players: playersWithMaxStats });
  } catch (err) {
    next(err);
  }
});

// 가장 높은 능력치를 찾는 함수
function getMaxStats(player) {
  const stats = {
    speed: player.speed,
    acceleration: player.acceleration,
    shootingFinish: player.shootingFinish,
    shootingPower: player.shootingPower,
    pass: player.pass,
    defense: player.defense,
    stamina: player.stamina,
    agility: player.agility,
    balance: player.balance,
    gk: player.gk,
  };

  // 상위 3개 스탯 찾기
  const topThreeStats = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return Object.fromEntries(topThreeStats);
}

/**
 * 선수 상세 조회 API
 * @route GET /players/:playerId
 * @param {number} playerId - 플레이어 ID
 * @returns {object} - 선수 이름, 키, 몸무게, 능력치
 */
router.get('/players/:playerId', async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await prisma.players.findUnique({
      where: {
        playerId: +playerId,
      },
      select: {
        name: true,
        height: true,
        weight: true,
        speed: true,
        acceleration: true,
        shootingFinish: true,
        shootingPower: true,
        pass: true,
        defense: true,
        stamina: true,
        agility: true,
        balance: true,
        gk: true,
      },
    });

    if (!player) {
      return res.status(404).json({ errorMessage: '해당 선수는 존재하지 않습니다.' });
    }

    return res.status(200).json({ player: player });
  } catch (err) {
    next(err);
  }
});

export default router;
