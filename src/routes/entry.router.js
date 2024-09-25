import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { verifyAccessToken } from '../middlewares/verifyAccessToken.js';

// 팀 구성할 때 jwt 인증 미들웨어가 필요하다면 import { verifyAccessToken } from.. 와 함께, 아래 라우터에서 verifyAccessToken 추가
const router = express.Router();

// const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const POSITIONS = ['DF', 'MF', 'FW'];

// router.post("/entry/:accountId", verifyAccessToken, async (req, res, next) => {
router.post('/entry/:accountId', async (req, res, next) => {
  const { accountId } = req.params;
  const { playerSelections } = req.body; // [{ playerId: Number, position: String }, ...] 배열 (4개)

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.user.accountId !== +accountId) {
      return res.status(403).json({ errorMessage: '권한이 없습니다.' });
    }

    // playerSelections가 배열이고 4개의 항목을 가지는지 확인
    if (!Array.isArray(playerSelections) || playerSelections.length !== 4) {
      return res.status(400).json({
        errorMessage: '정확히 4명의 선수와 포지션을 선택해야 합니다.',
      });
    }

    // 모든 포지션이 유효한지 확인
    for (const selection of playerSelections) {
      if (!POSITIONS.includes(selection.position)) {
        return res.status(400).json({
          errorMessage: `유효하지 않은 포지션: ${selection.position}`,
        });
      }
    }

    // 중복된 포지션이 있는지 확인
    const uniquePositions = new Set(playerSelections.map((sel) => sel.position));
    if (uniquePositions.size !== 4) {
      return res.status(400).json({
        errorMessage: '포지션은 중복될 수 없습니다. 각 포지션을 하나씩 선택하세요.',
      });
    }

    // 선택된 선수들이 계정의 로스터에 있는지 확인
    const playerIds = playerSelections.map((sel) => sel.playerId);
    const selectedPlayers = await prisma.rosters.findMany({
      where: {
        accountId: +accountId,
        playerId: { in: playerIds },
      },
      include: { player: true },
    });

    if (selectedPlayers.length !== 4) {
      return res.status(400).json({
        errorMessage: '선택된 선수 중 일부가 로스터에 없습니다.',
      });
    }

    // Squads에 이미 같은 포지션에 선수가 배치되어 있는지 확인 (필요 시)
    const existingSquads = await prisma.Squads.findMany({
      where: {
        accountId: +accountId,
        position: { in: playerSelections.map((sel) => sel.position) },
      },
    });

    if (existingSquads.length > 0) {
      return res.status(400).json({
        errorMessage: '이미 선택된 포지션에 선수가 배치되어 있습니다.',
      });
    }

    // 트랜잭션을 사용하여 Squads에 4명의 선수 추가
    const squadsEntries = await prisma.$transaction(
      playerSelections.map((selection) =>
        prisma.Squads.create({
          data: {
            accountId: +accountId,
            playerId: selection.playerId,
            position: selection.position,
          },
        })
      )
    );

    return res.status(200).json({
      message: '선수 팀 배치 성공!',
      squads: squadsEntries.map((entry) => ({
        squadsId: entry.squadsId,
        playerId: entry.playerId,
        position: entry.position,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// 팀 배치 목록 조회 (옵션)
router.get('/entry/:accountId', verifyAccessToken, async (req, res, next) => {
  const { accountId } = req.params;

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.user.accountId !== +accountId) {
      return res.status(403).json({ errorMessage: '권한이 없습니다.' });
    }

    // Squads에서 계정의 팀 배치 목록 조회
    const squadsEntries = await prisma.Squads.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    const responseSquads = squadsEntries.map((entry) => ({
      squadsId: entry.squadsId,
      playerId: entry.playerId,
      name: entry.player.name,
      position: entry.position,
    }));

    return res.status(200).json({
      message: '팀 배치 목록 조회 성공!',
      squads: responseSquads,
    });
  } catch (err) {
    next(err);
  }
});

// 팀 배치 삭제 (옵션)
router.delete('/entry/:accountId/:squadsId', verifyAccessToken, async (req, res, next) => {
  const { accountId, squadsId } = req.params;

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.user.accountId !== +accountId) {
      return res.status(403).json({ errorMessage: '권한이 없습니다.' });
    }

    // 팀 배치 삭제
    const deletedSquads = await prisma.Squads.deleteMany({
      where: {
        squadsId: +squadsId,
        accountId: +accountId,
      },
    });

    if (deletedSquads.count === 0) {
      return res.status(404).json({
        errorMessage: '삭제할 팀 배치를 찾을 수 없습니다.',
      });
    }

    return res.status(200).json({ message: '팀 배치 삭제 성공!' });
  } catch (err) {
    next(err);
  }
});

export default router;
