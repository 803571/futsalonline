# 풋살온라인

피파온라인을 오마주한 풋살 온라인이라는 게임을 만듭니다.

## 서버 주소
- `54.180.236.142`

## 서버 실행 (확인용)
- `yarn start` : 실행
- `yarn dev` : 개발 모드
- `yarn start-lobby:pm2` : 로비 실행
- `yarn start-game:pm2` : 게임 실행

## 서버 재실행 (확인용)
- `yarn restart-lobby:pm2` : 로비 실행
- `yarn restart-game:pm2` : 게임 실행

## 서버 종료 (확인용)
- `yarn delete-lobby:pm2` : 로비 종료
- `yarn delete-game:pm2` : 게임 종료

## 서버 체크 (확인용)
- `yarn logs:pm2` : 로그
- `yarn list:pm2` : 실행 중인 서버 리스트

## API 명세서
- [계정 API](docs/users-table.md)

## 테이블
- [선수 데이터 추가 예시](docs/players-add.sql)