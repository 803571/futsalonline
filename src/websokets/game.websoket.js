import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import url from 'url';
import { WebSocketServer } from 'ws';
import { startGame } from '../utils/gameUtils.js';
import { getSquads } from '../utils/prismaUtils.js';

dotenv.config();

function setUpGameWebSoket(server, port) {
  const wss = new WebSocketServer({ server });

  let players = [];
  let attackerInterval;

  wss.on('connection', (ws, req) => {
    const queryParams = new url.URL(req.url, 'http://localhost').searchParams;
    const token = queryParams.get('token');

    if (!token) {
      console.log('토큰이 없습니다. 연결 종료!');
      ws.send('unauthorized');
      ws.close();
      return;
    }

    // JWT 토큰을 각 플레이어 객체에 저장
    ws.token = token;

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        console.log('유효하지 않은 토큰입니다.');
        ws.send('unauthorized');
        ws.close();
        return;
      }

      const accountId = decoded.accountId;
      const userId = decoded.userId;

      console.log(`유저ID ${accountId} - 유저 ${userId}가 게임 서버에 접속했습니다!`);

      // accountId를 이용하여 스쿼드 정보 조회
      const squads = await getSquads(accountId);

      // 스쿼드 없으면 웹소켓 종료
      if (squads.length === 0) {
        ws.send('스쿼드 정보가 없습니다.');
        ws.close();
        return;
      }

      players.push(ws);

      ws.send('게임 시작!');

      // 1:1 매칭이므로 2명이 존재해야 게임 로직 실행
      if (players.length === 2) {
        await startGame(port, players, attackerInterval);
      }

      ws.on('close', () => {
        console.log(`유저 ${userId}가 게임 서버에서 이탈했습니다.`);
        players = players.filter((player) => player !== ws);

        if (players.length === 1) {
          clearInterval(attackerInterval);

          players.forEach((player) => {
            player.send('상대 유저가 이탈하였습니다...');
          });
        }
      });
    });
  });
}

export { setUpGameWebSoket };
