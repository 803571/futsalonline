import { WebSocketServer } from 'ws';

const gamePorts = [4444, 4445, 4446];
const portStatus = { 4444: 0, 4445: 0, 4446: 0 };

const waitingList = [];

export function setUpLobbyWebSoket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('새로운 클라이언트가 연결되었습니다!');

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

          const availablePort = findAvailablePort();
          
          // 유저 대기열 업데이트
          updateWaitingList();

          if (availablePort !== null) {
            portStatus[availablePort] = 2;

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
      console.log('클라이언트가 이탈했습니다.');
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

    function findAvailablePort() {
      for (const port of gamePorts) {
        if (portStatus[port] < 2) {
          return port;
        }
      }

      return null;
    }
  });
}