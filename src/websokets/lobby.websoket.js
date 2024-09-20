import { WebSocketServer } from 'ws';
import portUtil from '../utils/portUtils.js'

export function setUpLobbyWebSoket(server) {
  const wss = new WebSocketServer({ server });

  const waitingList = [];

  wss.on('connection', (ws) => {
    console.log('새로운 유저가 로비 서버에 접속했습니다!');

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
      console.log('유저가 로비 서버에서 이탈했습니다.');
      const index = waitingList.indexOf(ws);
      if (index !== -1) {
        waitingList.splice(index, 1);
        updateWaitingList();
      }
    });

    function updateWaitingList() {
      const waitingPlayers = waitingList.length;
      waitingList.forEach(client => {
        client.send(`대기열: ${waitingPlayers}...`);
        client.send(`다른 유저를 기다리는 중...`);
      });
    }
  });
}