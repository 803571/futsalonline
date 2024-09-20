const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = document.getElementById('userId').value;
  const password = document.getElementById('password').value;

  try {
    // 로그인 API 요청
    const response = await fetch('http://localhost:3333/api/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // 기존 JWT 토큰 제거(초기화)
      localStorage.clear();
      // JWT 토큰을 로컬 스토리지에 저장
      localStorage.setItem('jwtToken', data.token);
      // 로그인 성공 시 로비로 이동
      window.location.href = 'http://localhost:3333/lobby.html';
    } else {
      alert(data.errorMessage || '로그인 실패');
    }
  } catch (err) {
    console.error('로그인 중 오류 발생:', err);
    alert('로그인 요청 중 오류가 발생했습니다.');
  }
});
