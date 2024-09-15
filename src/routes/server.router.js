import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

let waitingUsers = []; // 매칭 대기열
let matchServerAddress = 'http://localhost:4444/api';

// 로비에서 매치 시작
router.post('/match', async (req, res, netx) => {
  const { userId } = req.body; // 여긴 로그인 인증으로 account에서 가져오는 걸로 수정

  if (!userId) {
    return res.status(400).json({ errorMessage: '로그인이 필요합니다!' });
  }

  // 대기열에 유저 추가
  waitingUsers.push(userId);

  // 2명 이상일 경우 매칭
  if (waitingUsers.length >= 2) {
    const users = waitingUsers.splice(0, 2); // 첫 두 명 매칭 - rankScore로 sort한 후 매치
    console.log(`${users[0]} VS ${users[1]} 매치 성사!`);

    try {
      // 게임 서버로 매치 정보 전송
      const response = await fetch(`${matchServerAddress}/game-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // JSON 형식으로 전송
        body: JSON.stringify({ users }), // 플레이어 정보 전송
      });

      // 게임 서버 응답
      if (!response.ok) {
        throw new Error(`매치 실패: ${response.statusText}`);
      }

      const result = await response.json();

      // 매치 유저 게임 서버로 이동
      return res.json({
        message: '경기 시작! 게임 서버 이동...',
        matchServerAddress,
        users,
        gameResult: result,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ errorMessage: '게임 서버 에러!' });
    }
  } else {
    // 매칭 대기 중
    return res.json({ message: '유저를 기다리는 중입니다...' });
  }
});

// 게임 끝난 후 로비로
router.post('/lobby-return', async (req, res, next) => {
  const { users } = req.body;

  if (!users || users.length !== 2) {
    return res.status(400).json({ errorMessage: '두 유저가 필요합니다!' });
  }

  console.log(`${users[0]}, ${users[1]} 로비 복귀.`);

  // 점수 처리 시작
  /*
   */

  // 로비 복귀 후 응답
  res.status(200).res.json({ message: '로비 복귀!', users });
});

// 게임 시작 API - 1분 후 자동 게임 종료
router.post('/game-start', async (req, res, next) => {
  const { users } = req.body;

  if (!users || users.length !== 2) {
    return res.status(400).json({ errorMessage: '매치에는 두 명의 유저가 필요합니다!' });
  }

  console.log(`게임시작! ${users[0]} VS ${users[1]}`);

  // 게임 시간 1분
  setTimeout(async () => {
    console.log('1분 지나면 로비 이동...');

    try {
      const lobbyServerAddress = 'http://localhost:3333/api';

      // 로비 서버에 요청해서 플레이어들을 로비로 돌려보냄
      const response = await fetch(`${lobbyServerAddress}/lobby-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // JSON 형식으로 전송
        body: JSON.stringify({ users }), // 플레이어 정보 전송
      });

      if (!response.ok) {
        throw new Error(`로비 복귀 실패: ${response.statusText}`);
      }

      console.log('두 유저 로비 복귀!');
    } catch (err) {
      console.error('로비 복귀 실패:', err.message);
    }
  }, 60000); // 1분 - 60,000 ms

  // 매칭 성공 응답
  res.json({ message: '게임 종료!', users });
});

// 게임 종료 API - 필요 시 호출
router.post('/game-end', async (req, res, next) => {
  const { users } = req.body;

  if (!users || users.length !== 2) {
    return res.status(400).json({ errorMessage: '매치에는 두 명의 유저가 필요합니다!' });
  }

  console.log(`${users[0]} - ${users[1]} 게임 종료!`);

  res.json({ message: '게임 종료!, 로비로 복귀합니다...' });
});

export default router;
