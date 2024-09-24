import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/**
 * 랭킹 점수 변동 API
 * @route POST /match/result
 * @param {number} - accountId : 계정 ID
 * @param {string} - opponent : 상대 유저ID
 * @param {string} - result : 결과 (win, draw, lose)
 * @param {Date} - startTime : 경기 시작 시간
 * @param {Date} - endTime : 경기 종료 시간
 * @returns {object} - 성공/실패 메시지,
 */
router.post('/match/result', async (req, res, next) => {
  try {
    const { accountId, opponent, result, startTime, endTime } = req.body;

    // 기존 랭킹 데이터 가져오기
    const rankingData = await prisma.gameRankings.findUnique({
      where: { accountId: +accountId },
    });

    if (!rankingData) {
      return res.status(404).json({ errorMessage: '랭킹 정보를 찾을 수 없습니다.' });
    }

    // playRecords에서 기록 가져오기
    let playRecords = rankingData.playRecords || { matches: [], record: { win: 0, draw: 0, lose: 0 } };

    // 새로운 경기 기록 추가
    playRecords.matches.push({
      opponent,
      result,
      startTime,
      endTime,
    });

    // 경기 결과에 따라 랭킹 데이터 변경
    if (result === 'win') {
      playRecords.record.win += 1;
      rankingData.rankScore += 10;
    } else if (result === 'lose') {
      playRecords.record.lose += 1;
      rankingData.rankScore -= 10;
    } else if (result === 'draw') {
      playRecords.record.draw += 1;
    }

    // 승률 계산
    const totalMatches = playRecords.record.win + playRecords.record.lose + playRecords.record.draw;
    const winningRate = totalMatches > 0 ? (playRecords.record.win / totalMatches) * 100 : 0;

    // 랭킹 데이터 업데이트
    await prisma.gameRankings.update({
      where: { accountId: +accountId },
      data: {
        winningRate: Math.round(winningRate),
        rankScore: rankingData.rankScore,
        playRecords: playRecords,
      },
    });

    return res.status(200).json({ message: '경기 결과가 성공적으로 저장되었습니다.', winningRate });
  } catch (err) {
    next(err);
  }
});

/**
 * 랭킹 조회 API
 * @route GET /ranking
 * @returns {object} - 성공/실패 메시지, 랭킹 목록
 */
router.get('/ranking', async (req, res, next) => {
  try {
    const rankings = await prisma.gameRankings.findMany({
      orderBy: {
        rankScore: 'desc',
      },
      select: {
        accountId: true,
        winningRate: true,
        rankScore: true,
        playRecords: true,
      },
    });

    const formattedRankings = rankings.map((ranking) => ({
      accountId: ranking.accountId,
      winningRate: ranking.winningRate,
      rankScore: ranking.rankScore,
      record: ranking.playRecords?.record || {},
    }));

    return res.status(200).json({ message: '랭킹 조회 성공!', ranking: formattedRankings });
  } catch (err) {
    next(err);
  }
});

/**
 * 전적 조회 API
 * @route GET /ranking/:accountId
 * @param {number} - accountId : 계정 ID
 * @returns {object} - 성공/실패 메시지, 랭킹 목록
 */
router.get('/ranking/:accountId', async (req, res, next) => {
  const { accountId } = req.params;

  try {
    // accountId로 랭킹 정보 가져오기
    const ranking = await prisma.gameRankings.findUnique({
      where: { accountId: +accountId },
      select: {
        rankScore: true,
        winningRate: true,
        playRecords: true,
      },
    });

    if (!ranking) {
      return res.status(404).json({ message: '랭킹 정보를 찾을 수 없습니다.' });
    }

    // playRecords에서 전적 가져오기
    const matches = ranking.playRecords?.matches || [];
    const formattedMatches = matches
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .map((match) => ({
        opponent: match.opponent,
        result: match.result,
        startTime: match.startTime,
        endTime: match.endTime,
      }));

    const responseRankings = {
      rankScore: ranking.rankScore,
      winningRate: ranking.winningRate,
      matches: formattedMatches,
    };

    return res.status(200).json({ message: '전적 조회 성공!', ranking: responseRankings });
  } catch (err) {
    next(err);
  }
});

export default router;