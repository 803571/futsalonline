import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import portUtil from '../utils/portUtils.js';
import dotenv from 'dotenv';
import url from 'url';

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

      const userId = decoded.userId;

      // 이미 연결된 경우 연결 종료
      if (activeConnections[userId]) {
        const existingWs = activeConnections[userId];
        console.log(`유저 ${userId}는 이미 연결되어 있습니다. 기존 연결을 종료합니다.`);
        existingWs.send('already_connected');
        existingWs.close();
      }

      // 현재 연결된 유저로 등록
      activeConnections[userId] = ws;

      // 섭속 + 인증 알림
      console.log(`유저 ${userId}가 로비 서버에 접속했습니다!`);
      ws.send('authorized');

      // JWT 인증이 성공한 후에만 대기열에 추가 가능
      ws.on('message', (message) => {
        const messageStr = message.toString();
        console.log('Received message:', messageStr);

        if (messageStr === 'Start game') {
          if (!waitingList.includes(ws)) {
            waitingList.push(ws);
          }

          // 유저 대기열 업데이트
          updateWaitingList();

          if (waitingList.length >= 3) {
            const player1 = waitingList.shift();
            const player2 = waitingList.shift();

            const availablePort = portUtil.findAvailablePort();

            // 유저 대기열 업데이트
            updateWaitingList();

            if (availablePort !== null) {
              portUtil.setPortStatus(availablePort, 2);

              player1.send(`redirect:${availablePort}`);
              player2.send(`redirect:${availablePort}`);
            } else {
              player1.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
              player2.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
            }
          }
        }
      });

      ws.on('close', () => {
        console.log(`유저 ${userId}가 로비 서버에서 이탈했습니다.`);
        const index = waitingList.indexOf(ws);
        if (index !== -1) {
          waitingList.splice(index, 1);
          updateWaitingList();
        }

        // 연결 종료 시 activeConnections에서 해당 유저 제거
        delete activeConnections[userId];
      });
    });

    // 대기열 업데이트 함수
    function updateWaitingList() {
      const waitingPlayers = waitingList.length;
      waitingList.forEach((client) => {
        client.send(`대기열: ${waitingPlayers}...`);
        client.send(`다른 유저를 기다리는 중...`);
      });
    }
  });
}
