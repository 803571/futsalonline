import dotenv from 'dotenv';
import url from 'url';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import portUtil from '../utils/portUtils.js';
import { prisma } from '../utils/prisma/index.js';
import { gameState } from '../utils/state/gameState.js';

dotenv.config();

export function setUpLobbyWebSoket(server) {
  const wss = new WebSocketServer({ server });

  const waitingList = [];
  const activeConnections = {};

  wss.on('connection', (ws, req) => {
    const queryParams = new url.URL(req.url, 'http://localhost').searchParams;
    const token = queryParams.get('token');

    if (!token) {
      console.log('토큰이 없습니다. 연결 종료!');
      ws.send('unauthorized');
      ws.close();
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log('유효하지 않은 토큰입니다.');
        ws.send('unauthorized');
        ws.close();
        return;
      }

      const accountId = decoded.accountId;
      const userId = decoded.userId;

      // 이미 연결된 경우 연결 종료
      if (activeConnections[userId]) {
        const existingWs = activeConnections[userId].ws;
        console.log(`유저 ${userId}는 이미 연결되어 있습니다. 기존 연결을 종료합니다.`);

        if (existingWs && typeof existingWs.send === 'function') {
          existingWs.send('already_connected');
          existingWs.close();
        } else {
          console.log(`유저 ${userId}의 기존 연결이 유효하지 않습니다.`);
        }
      }

      // 현재 연결된 유저로 등록
      activeConnections[userId] = { ws, accountId };

      // 접속 + 인증
      console.log(`유저 ${userId}가 로비 서버에 접속했습니다!`);
      ws.send('authorized');

      // JWT 인증이 성공한 후에만 대기열에 추가 가능
      ws.on('message', async (message) => {
        const messageStr = message.toString();
        console.log('Received message:', messageStr);

        if (messageStr === 'Start game') {
          if (!waitingList.some((player) => player.ws === ws)) {
            waitingList.push({ ws, accountId });
          }

          // 유저 대기열 업데이트
          updateWaitingList();

          await startMatching();
        }
      });

      ws.on('close', () => {
        console.log(`유저 ${userId}가 로비 서버에서 이탈했습니다.`);
        const index = waitingList.findIndex((player) => player.ws === ws);
        if (index !== -1) {
          waitingList.splice(index, 1);
          updateWaitingList();
        }

        // 연결 종료 시 activeConnections에서 해당 유저 제거
        delete activeConnections[userId];
      });
    });

    async function startMatching() {
      // 초기 오차 범위 설정
      let currentRange = 0;
      // 매칭 시작
      gameState.matchInterval = setInterval(async () => {
        const rankScores = await getRankScores(); // 플레이어의 랭킹 점수 가져오기

        // 플레이어 점수가 없는 경우 처리
        if (rankScores.length < 2) {
          clearInterval(gameState.matchInterval);
          return;
        }

        // 시간이 지날수록 오차 범위 증가
        currentRange += 50;

        // 매칭 로직
        for (let i = 0; i < rankScores.length - 1; i++) {
          const player1 = rankScores[i].player.ws;
          const score1 = rankScores[i].rankScore;

          for (let j = i + 1; j < rankScores.length; j++) {
            const player2 = rankScores[j].player.ws;
            const score2 = rankScores[j].rankScore;

            // 오차 범위 내에 있는 경우 매칭
            if (Math.abs(score1 - score2) <= currentRange) {
              const availablePort = portUtil.findAvailablePort();

              if (availablePort !== null) {
                console.log("매칭 실행됨 " + waitingList.length);
                portUtil.setPortStatus(availablePort, 2);
                player1.send(`redirect:${availablePort}`);
                player2.send(`redirect:${availablePort}`);

                // 매칭 완료 후 대기 리스트에서 제거 (i 이후 j 이므로 j부터 제거)
                waitingList.splice(j, 1); // player2 제거
                waitingList.splice(i, 1); // player1 제거
                // 유저 대기열 업데이트
                updateWaitingList();

                // 매칭 성공 후 남은 유저끼리 매칭 로직
                if (waitingList.length < 2) {
                  clearInterval(gameState.matchInterval);
                  return;
                }

                i--; // 다음 매칭을 위해 인덱스 조정
                break; // 매칭이 완료되었으므로 더 이상의 매칭을 중단
              } else {
                player1.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
                player2.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
              }
            }
          }
        }
      }, 5000); // 5초마다 매칭 체크
    }

    async function getRankScores() {
      const rankScores = await Promise.all(
        waitingList.map(async (player) => {
          const ranking = await prisma.gameRankings.findUnique({
            where: {
              accountId: +player.accountId,
            },
            select: {
              rankScore: true, // rankScore만 선택
            },
          });
          return {
            player,
            rankScore: ranking ? ranking.rankScore : null, // 랭킹 점수 가져오기
          };
        })
      );

      return rankScores.filter((rank) => rank.rankScore !== null); // 유효한 점수만 반환
    }

    // 대기열 업데이트 함수
    function updateWaitingList() {
      const waitingPlayers = waitingList.length;

      waitingList.forEach((client) => {
        if (client.ws && typeof client.ws.send === 'function') {
          client.ws.send(`대기열: ${waitingPlayers}...`);
          client.ws.send(`다른 유저를 기다리는 중...`);
        } else {
          console.log('유효하지 않은 WebSocket 인스턴스입니다.');
        }
      });
    }
  });
}
