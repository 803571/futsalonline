const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = document.getElementById('userId').value;
  const password = document.getElementById('password').value;

  try {
    // 로그인 API
    // localhost
    const response = await fetch('http://54.180.236.142:3333/api/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ userId, password }),
    });

    const data = await response.json();

    /*
    처음에는 localStorage를 사용했지만 테스트에서 같은 브라우저를 사용하여,
    localStorage가 공유되므로 sessionStorage로 변경
    */
    if (response.ok && data.token) {
      // 세션 스토리지에서 기존 JWT 토큰 제거(초기화)
      sessionStorage.clear();
      // JWT 토큰, 세션 스토리지 저장
      sessionStorage.setItem('jwtToken', data.token);
      // 로그인 성공 시 로비 페이지로 이동
      window.location.href = 'http://54.180.236.142:3333/lobby.html';
      //window.location.href = 'http://localhost:3333/lobby.html';
    } else {
      alert(data.errorMessage || '로그인 실패');
    }
  } catch (err) {
    console.error('로그인 중 오류 발생:', err);
    alert('로그인 요청 중 오류가 발생했습니다.');
  }
});
