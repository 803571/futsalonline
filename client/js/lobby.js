const waitingListDiv = document.getElementById('waitingList');
const statusMessageDiv = document.getElementById('statusMessage');
const startGameBtn = document.getElementById('startGameBtn');

// WebSocket 변수
let ws;

// 세션 스토리지에서 JWT 토큰 가져오기
const token = sessionStorage.getItem('jwtToken');
if (!token) {
  alert('로그인이 필요합니다.');
  window.location.href = 'http://54.180.236.142:3333/login.html';
} else {
  // 기존 WebSocket 연결이 있을 경우 종료 - 방어코드
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
    ws = null;
  }

  // JWT 토큰을 쿼리 파라미터로 WebSocket에 전달
  ws = new WebSocket(`ws://54.180.236.142:3333?token=${token}`);

  ws.onmessage = (event) => {
    const message = event.data;
    console.log('Server message:', message);

    if (message === 'already_connected') {
      alert('이미 로그인된 계정입니다. 다시 로그인 해주세요.');
      window.location.href = 'http://54.180.236.142:3333/login.html';
      return;
    }

    if (message.startsWith('대기열:')) {
      waitingListDiv.textContent = message;
    } else if (message.startsWith('Game starting') || message.startsWith('다른 유저를') || message.startsWith('모든 게임 서버')) {
      statusMessageDiv.textContent = message;
    }

    if (message.startsWith('redirect:')) {
      // URL에서 포트 추출, 게임 서버로 리디렉션
      const port = message.split(':')[1];

      // 게임 서버로 리디렉션 전에 로비서버 WebSocket 연결 종료
      ws.close();

      window.location.href = `http://54.180.236.142:${port}/game.html?port=${port}&token=${token}`;
    }
  };

  startGameBtn.addEventListener('click', () => {
    ws.send('Start game');
  });

  ws.onopen = () => {
    console.log('WebSocket 연결되었습니다.');
  };

  ws.onerror = (error) => {
    console.error('WebSocket 오류:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
  };
}
