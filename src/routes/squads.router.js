import express from 'express';
import portUtil from '../utils/portUtils.js';
import { prisma } from '../utils/prisma/index.js';
import authSignIn from '../middlewares/auth.signin.middleware.js';

const router = express.Router();

const POSITIONS = ['GK', 'DF', 'MF', 'FW'];

/**
 * 선발 선수 추가 API - 배열(4개) 전달
 * @route POST /squad/:accountId
 * @param {string} accountId - 계정 ID
 * @param {Array} playerSelections - 선수 리스트 (playerId, position)
 * @returns {object} - 성공 or 실패 메시지 / 선수 엔트리
 */
router.post('/squad/:accountId', authSignIn, async (req, res, next) => {
  const { accountId } = req.params;
  const { playerSelections } = req.body;

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.account.accountId !== +accountId) {
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

    console.log(selectedPlayers);

    if (selectedPlayers.length <= 4) {
      return res.status(400).json({
        errorMessage: '선택된 선수 중 일부가 로스터에 없습니다.',
      });
    }

    // Squad에 이미 같은 포지션에 선수가 배치되어 있는지 확인 (필요 시)
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

    // 트랜잭션을 사용하여 스쿼드에 4명의 선수 추가
    const squadEntries = await prisma.$transaction(
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
      message: '선수 스쿼드 배치 성공!',
      squad: squadEntries.map((entry) => ({
        squadId: entry.squadId,
        playerId: entry.playerId,
        position: entry.position,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 선발 선수 삭제
 * @route DELETE /squad/:accountId
 * @param {string} accountId - 계정 ID (params)
 * @returns {object} - 성공 or 실패 메시지 / 선수 엔트리
 */
router.delete('/squad/:accountId', authSignIn, async (req, res, next) => {
  const { accountId } = req.params;

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.account.accountId !== +accountId) {
      return res.status(403).json({ errorMessage: '권한이 없습니다.' });
    }

    // 스쿼드 삭제
    const deletedSquads = await prisma.Squads.deleteMany({
      where: {
        accountId: +accountId,
      },
    });

    if (deletedSquads.count === 0) {
      return res.status(404).json({
        errorMessage: '삭제할 선발 선수를 찾을 수 없습니다.',
      });
    }

    return res.status(200).json({ message: '선발 선수 삭제 성공!' });
  } catch (err) {
    next(err);
  }
});

/**
 * 선발 선수 교체
 * @route POST /squad/substitution/:accountId
 * @param {string} accountId - 계정 ID (params)
 * @param {number} playerId - 선수 ID
 * @param {string} position - 포지션
 * @returns {object} - 성공 or 실패 메시지 / 선수 엔트리
 */
router.post('/squad/substitution/:accountId', authSignIn, async (req, res, next) => {
  const { accountId } = req.params;
  const { playerId, position } = req.body;

  try {
    // accountId가 로그인된 사용자와 일치하는지 확인
    if (req.account.accountId !== +accountId) {
      return res.status(403).json({ errorMessage: '권한이 없습니다.' });
    }

    if (!POSITIONS.includes(position)) {
      return res.status(400).json({
        errorMessage: `유효하지 않은 포지션: ${position}`,
      });
    }

    // 선택된 선수 로스터에 있는지 확인
    const selectedPlayer = await prisma.rosters.findFirst({
      where: {
        accountId: +accountId,
        playerId: +playerId,
      },
    });

    if (!selectedPlayer) {
      return res.status(400).json({
        errorMessage: '선택한 선수가 로스터에 없습니다.',
      });
    }

    // 해당 포지션 선수 확인
    const existingPlayer = await prisma.Squads.findFirst({
      where: {
        accountId: +accountId,
        position: position,
      },
    });

    if (!existingPlayer) {
      return res.status(404).json({
        errorMessage: '해당 포지션에 배치된 선수가 없습니다.',
      });
    }

    const anotherPositionPlayer = await prisma.Squads.findFirst({
      where: {
        accountId: +accountId,
        playerId: +playerId,
        NOT: {
          position: position,
        },
      },
    });

    if (anotherPositionPlayer) {
      return res.status(400).json({
        errorMessage: '이미 다른 포지션에 배치되어 있는 선수입니다.',
      });
    }

    // 선수 교체
    const updatedPlayer = await prisma.Squads.update({
      where: { squadId: +existingPlayer.squadId },
      data: {
        playerId: +playerId,
      },
    });

    return res.status(200).json({
      message: '선수 교체 성공!',
      player: {
        squadId: updatedPlayer.squadId,
        playerId: updatedPlayer.playerId,
        position: updatedPlayer.position,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 선발 선수 조회
 * @route GET /squad/:accountId
 * @param {string} accountId - 계정 ID (params)
 * @returns {object} - 성공 or 실패 메시지 / 선수 엔트리
 */
router.get('/squad/:accountId', async (req, res, next) => {
  const { accountId } = req.params;

  const account = await prisma.accounts.findUnique({
    where: { accountId: +accountId },
  });

  if (!account) {
    return res.status(404).json({ errorMessage: '해당 계정을 찾을 수 없습니다.' });
  }

  try {
    // 스쿼드 목록 조회
    const squadEntries = await prisma.squads.findMany({
      where: { accountId: +accountId },
      include: { player: true },
    });

    const responseSquad = squadEntries.map((entry) => ({
      squadId: entry.squadId,
      playerId: entry.playerId,
      name: entry.player.name,
      position: entry.position,
    }));

    return res.status(200).json({
      message: '스쿼드 목록 조회 성공!',
      squad: responseSquad,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
