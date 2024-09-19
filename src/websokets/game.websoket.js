import { WebSocketServer } from 'ws';

let players = [];

let attackerInterval;
let currentAttacker = null;

function setUpGameWebSoket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('유저가 게임 서버에 접속했습니다!');

    players.push(ws);

    ws.send('게임 시작!');

    // 1:1 매칭이므로 2명이 존재해야 게임 로직 실행
    if (players.length === 2) {
      startGame();
    }

    ws.on('close', () => {
      console.log('유저가 게임 서버에서 이탈했습니다.');
      players = players.filter((player) => player !== ws);
      if (players.length === 0) {
        clearInterval(attackerInterval);
      }
    });
  });
}

function startGame() {
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
}

export { setUpGameWebSoket };