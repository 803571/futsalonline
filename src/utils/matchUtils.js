
import portUtil from '../utils/portUtils.js';
import { getRankScores } from '../utils/prismaUtils.js';
import { gameState } from '../utils/state/gameState.js';

export async function startMatching(waitingList) {
  // 랭킹 점수 오차 범위
  let currentRange = 0;

  // 매칭 시작
  gameState.matchInterval = setInterval(async () => {
    // 유저 rankScore 가져오기
    const rankScores = await getRankScores(waitingList);

    // 두 명 이하일 경우(rankScore 없을 때)
    if (rankScores.length < 2) {
      clearInterval(gameState.matchInterval);
      return;
    }

    // 매칭 안 잡히면 오차 범위 증가
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

            // 매칭 후 대기 리스트에서 유저를 제거
            waitingList.splice(waitingList.indexOf(player1), 1);
            waitingList.splice(waitingList.indexOf(player2), 1);

            // 유저 대기열 업데이트
            await updateWaitingList(waitingList);

            // 매칭 성공 후 남은 유저끼리 매칭 로직
            if (waitingList.length < 2) {
              clearInterval(gameState.matchInterval);
              return;
            }

            // 매칭이 이뤄졌으므로 인덱스 조정 후 해당 매칭은 종료
            i--;
            break;
          } else {
            player1.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
            player2.send('모든 게임 서버가 가득 찼습니다. 잠시만 기다려주세요...');
          }
        }
      }
    }
  }, 5000); // 5초 interval
}

// 대기열 업데이트 함수
export async function updateWaitingList(waitingList) {
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
