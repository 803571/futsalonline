import dotenv from 'dotenv';
import url from 'url';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { startMatching, updateWaitingList } from '../utils/matchUtils.js';

dotenv.config();

export function setUpLobbyWebSoket(server) {
  const wss = new WebSocketServer({ server });

  const waitingList = [];
  const activeConnections = {};

  wss.on('connection', (ws, req) => {
    //const queryParams = new url.URL(req.url, 'http://54.180.236.142').searchParams;
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
          await updateWaitingList(waitingList);

          await startMatching(waitingList);
        }
      });

      ws.on('close', async () => {
        console.log(`유저 ${userId}가 로비 서버에서 이탈했습니다.`);
        const index = waitingList.findIndex((player) => player.ws === ws);
        if (index !== -1) {
          waitingList.splice(index, 1);
          await updateWaitingList(waitingList);
        }

        // 연결 종료 시 activeConnections에서 해당 유저 제거
        delete activeConnections[userId];
      });
    });
  });
}
