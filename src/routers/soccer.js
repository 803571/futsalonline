import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.post("/soccer", authSigninMiddleware, async (req, res, next) => {
  const { accountId } = req.account;

  // 내 계정 이외의 계정과 매칭
  // 현재 로그인한 계정을 제외한 모든 계정 조회

  // Case 축구 매칭에 실패했을 경우,
  // 1.간단하게 할 것인가.
  // 2.축구 매칭에 들어가게되면 계속 반복할 것인가?

  const accountList = await prisma.accounts.findMany({
    where: {
      NOT: {
        accountId: accountId,
      },
    },
  });

  if (!accountList) {
    return res
      .status(400)
      .json({ errorMessage: `현재 매칭중인 축구팀이 없습니다.` });
  }

  const start = accountList[0].accountId;
  const end = accountList[accountList.length - 1].accountId;
  const Matching = Math.floor(Math.random() * (end - start + 1)) + start;

  // 매칭 상대의 팀 정보와 내 팀 정보를 불러와서 비교하기
  const myTeam = await prisma.teams.findMany({
    where: {
      accountId: accountId,
    },
  });

  const vsTeam = await prisma.teams.findMany({
    where: {
      accountId: Matching,
    },
  });

  if (!myTeam || !vsTeam) {
    return res.status(400).json({ errorMessage: `구성된 팀이 없어요.` });
  }

  // 나의 팀 전투력 측정
  let myTeamPower = 0;
  for (let key in myTeam) {
    const { playerId } = myTeam[key];

    const player = await prisma.players.findFirst({
      where: { playerId: playerId },
    });

    const playerLv = await prisma.rosters.findFirst({
      where: { playerId: playerId },
    });

    // 밑에 0.3 , 0.5는 예시
    // 플레이어 레벨당 1개의 스텟이 1씩 오른다.
    myTeamPower +=
      player.speed * 0.3 +
      player.acceleration * 0.3 +
      player.shootingFinish * 0.5 +
      player.shootingPower * 0.3 +
      player.pass * 0.3 +
      playerLv * 5;
  }

  // 상대 팀 전투력 측정
  let vsTeamPower = 0;
  for (let key in vsTeam) {
    const { playerId } = vsTeam[key];

    const player = await prisma.players.findFirst({
      where: { playerId: playerId },
    });

    const playerLv = await prisma.rosters.findFirst({
      where: { playerId: playerId },
    });
    // 밑에 0.3 , 0.5는 예시
    vsTeamPower +=
      player.speed * 0.3 +
      player.acceleration * 0.3 +
      player.shootingFinish * 0.5 +
      player.shootingPower * 0.3 +
      player.pass * 0.3 +
      playerLv * 5;
  }

  let comparePower = (myTeamPower + vsTeamPower) * Math.random();
  if (comparePower < myTeamPower) {
    // 나의 팀이 승리
    await prisma.gameRankings.update({
      data: {
        playRecords: [vsTeam.accountId, "win"],
      },
    });
  } else if (comparePower === myTeamPower) {
    // 동점
  } else {
    // 상대 팀이 승리
  }

  return res.status(200).json({ message: "축구 게임 끝" });
});
export default router;
