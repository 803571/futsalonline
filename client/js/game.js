const statusDiv = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const port = params.get('port');

const token = params.get('token');

if (token) {
  sessionStorage.clear();
  sessionStorage.setItem('jwtToken', token);
} else {
  console.error('JWT 토큰이 없습니다. 다시 로그인하세요.');
  window.location.href = 'http://localhost:3333/login.html';
}

if (port) {
  const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);

  ws.onopen = () => {
    console.log('Connected to the game server on port', port);
  };

  ws.onmessage = (event) => {
    console.log('Game server message:', event.data);
    addLog('Game server message: ' + event.data);

    if (event.data.includes('게임이 종료되었습니다')) {
      const getToken = sessionStorage.getItem('jwtToken');

      fetch('http://localhost:3333/api/game-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken}`, // JWT 토큰을 헤더에 추가
        },
        body: JSON.stringify({ port }),
      })
        .then((response) => response.json())
        .then((data) => {
          addLog(data.message);
          setTimeout(() => {
            window.location.href = `${data.redirectUrl}?token=${getToken}`;
          }, 1000);
        })
        .catch((err) => {
          console.error('Error calling endGame API:', err);
        });
    }
  };

  ws.onerror = (err) => {
    console.error('게임 서버 에러(웹소켓):', err);
  };

  ws.onclose = () => {
    addLog('게임 서버 연결을 종료합니다.');
  };
} else {
  addLog('포트 에러.');
  console.error('포트 에러.');
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  statusDiv.textContent += `\n[${timestamp}] ${message}`;
  statusDiv.scrollTop = statusDiv.scrollHeight;
}
