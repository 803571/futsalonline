import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.post("/soccer", authSigninMiddleware, async (req, res, next) => {
  const { accountId } = req.account;

  // 내 계정 이외의 계정과 매칭
  // 현재 로그인한 계정을 제외한 모든 계정 조회


  // 매칭 테이블에 실어버리기
  const isMatched = await prisma.matching.findFirst({
    where: {
      accountId: accountId,
    }
  })

  if(isMatched) {
    return res.status(400).json({message: `이미 매칭을 돌리고 있습니다.`});
  }


  const myMatching = await prisma.matching.create({
    data: {
      accountId: accountId,
    }
  })

  let findCheck = false;

  try{
     const timer = setTimeout(() => {
        const game = setInterval(async () => {
             const matchingList = await prisma.matching.findMany({
                  NOT: {
                    accountId: myMatching.accountId,
                  },
                  rankScore: {
                    gt: myRanking.rankScore - 500,
                    lt: myRanking.rankScore + 500,
                  }
             })
            
             if(!matchingList) {
                setInterval(game, 1000);
             }
             
             const myRanking = await prisma.gameRankings.findFirst({
              where: {
                accountId: myMatching.accountId,
              }
             })
             // 매칭 상대 하나 정하기
             const randomMatching = Math.floor(Math.random() * matchingList.length);

             const vsRanking = await prisma.gameRankings.findFirst({
               where: {
                accountId: matchingList[randomMatching].accountId,
               }

             })

             if(!vsRanking) {
               setInterval(game,1000)
             }
             else {
              clearInterval(game); 
             }
             
         },1000)

         if(findCheck) {
          clearTimeout(timer);
         }
     },60000)

     // 매칭 상대와 게임하기
     

  }
  catch(err) {

  }

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
