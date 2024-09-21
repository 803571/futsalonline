import { WebSocketServer } from 'ws';
import portUtil from '../utils/portUtils.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import url from 'url';

function setUpGameWebSoket(server, port) {
  const wss = new WebSocketServer({ server });

  try {
    console.log('현재 포트 상태 : ' + portUtil.getPortStatus());
  } catch (err) {
    console.log(err);
  }

  let players = [];
  let attackerInterval;
  let currentAttacker = null;

  wss.on('connection', (ws) => {
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

      console.log(`유저 ${userId}가 게임 서버에 접속했습니다!`);

      players.push(ws);

      ws.send('게임 시작!');

      // 1:1 매칭이므로 2명이 존재해야 게임 로직 실행
      if (players.length === 2) {
        startGame(port);
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

  function startGame(port) {
    attackerInterval = setInterval(() => {
      if (players.length < 2) return;

      const newAttacker = players[Math.floor(Math.random() * players.length)];

      players.forEach((player) => {
        if (player === newAttacker) {
          player.send('공격 중!');
        } else {
          player.send('수비 중!');
        }
      });

      currentAttacker = newAttacker;
    }, 3000);

    setTimeout(() => {
      clearInterval(attackerInterval);
      endGame(port);
    }, 10 * 1000); // 1분 - 60
  }

  function endGame(port) {
    players.forEach((player) => {
      player.send(`게임이 종료되었습니다. 로비로 돌아갑니다.`);
    });

    setTimeout(() => {
      players.forEach((player) => {
        player.close();
      });

      players = [];
    }, 1000); // 1초 대기 후 연결 종료
  }
}

export { setUpGameWebSoket };
