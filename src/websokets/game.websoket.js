import { WebSocketServer } from 'ws';
import portUtil from '../utils/portUtils.js';
import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import url from 'url';

dotenv.config();

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

  wss.on('connection', (ws, req) => {
    const queryParams = new url.URL(req.url, 'http://localhost').searchParams;
    const token = queryParams.get('token');

    if (!token) {
      console.log('토큰이 없습니다. 연결 종료!');
      ws.send('unauthorized');
      ws.close();
      return;
    }

    // JWT 토큰을 각 플레이어 객체에 저장
    ws.token = token;

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        console.log('유효하지 않은 토큰입니다.');
        ws.send('unauthorized');
        ws.close();
        return;
      }

      const accountId = decoded.accountId;
      const userId = decoded.userId;

      console.log(`유저ID ${accountId} - 유저 ${userId}가 게임 서버에 접속했습니다!`);

      // accountId를 이용하여 스쿼드 정보 조회
      const teams = await getClubs(accountId);

      // 스쿼드 없으면 웹소켓 종료
      if (teams.length === 0) {
        ws.send('팀 정보가 없습니다.');
        ws.close();
        return;
      }

      players.push(ws);

      ws.send('게임 시작!');

      // 1:1 매칭이므로 2명이 존재해야 게임 로직 실행
      if (players.length === 2) {
        await startGame(port);
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

  async function startGame(port) {
    if (players.length !== 2) return;

    const playerA = players[0];
    const playerB = players[1];

    // 각 플레이어의 JWT 토큰에서 accountId를 추출
    const accountAId = jwt.decode(playerA.token).accountId;
    const accountBId = jwt.decode(playerB.token).accountId;

    // 각 플레이어의 팀 스탯 계산
    const teamAStats = await calculateStats(accountAId);
    const teamBStats = await calculateStats(accountBId);

    if (!teamAStats || !teamBStats) {
      console.error('스탯을 불러오는 중 오류가 발생했습니다.');
      return;
    }

    // 각 팀의 총합 스탯을 계산하여 비교 (모든 스탯 합계)
    const totalStatsA = Object.values(teamAStats).reduce((acc, stat) => acc + stat, 0);
    const totalStatsB = Object.values(teamBStats).reduce((acc, stat) => acc + stat, 0);

    console.log(`유저 A 총합 스탯: ${totalStatsA}`);
    console.log(`유저 B 총합 스탯: ${totalStatsB}`);

    attackerInterval = setInterval(() => {
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

  async function endGame(port) {
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

  async function getClubs(accountId) {
    try {
      const clubs = await prisma.teams.findMany({
        where: { accountId: +accountId },
      });

      return clubs;
    } catch (err) {
      console.error('팀 조회 오류:', err);
      return [];
    }
  }

  async function calculateStats(accountId) {
    try {
      const teamPlayers = await prisma.teams.findMany({
        where: { accountId: +accountId },
        include: { player: true }, // 각 팀의 player 정보를 포함시킴
      });
  
      if (teamPlayers.length === 0) {
        console.error('선수를 찾을 수 없습니다.');
        return null;
      }

      const totalStats = {
        speed: 0,
        acceleration: 0,
        shootingFinish: 0,
        shootingPower: 0,
        pass: 0,
        defense: 0,
        stamina: 0,
        agility: 0,
        balance: 0,
        gk: 0,
      };
  
      // 팀의 모든 선수들의 스탯을 합산
      teamPlayers.forEach((team) => {
        const player = team.player; // 각 팀에 속한 선수 정보
  
        totalStats.speed += player.speed;
        totalStats.acceleration += player.acceleration;
        totalStats.shootingFinish += player.shootingFinish;
        totalStats.shootingPower += player.shootingPower;
        totalStats.pass += player.pass;
        totalStats.defense += player.defense;
        totalStats.stamina += player.stamina;
        totalStats.agility += player.agility;
        totalStats.balance += player.balance;
        totalStats.gk += player.gk;
      });

      return totalStats;
    } catch (error) {
      console.error('스탯 계산 중 오류 발생:', error);
      return null;
    }
  }
}

export { setUpGameWebSoket };
