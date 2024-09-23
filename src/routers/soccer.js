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
    },
  });

  if (isMatched) {
    return res.status(400).json({ message: `이미 매칭을 돌리고 있습니다.` });
  }

  const myMatching = await prisma.matching.create({
    data: {
      accountId: accountId,
    },
  });

  const myRanking = await prisma.gameRankings.findFirst({
    where: {
      accountId: myMatching.accountId,
    },
  });

  let findCheck = false;

  try {
    const interval = setInterval(async () => {
      const matchingList = await prisma.matching.findMany({
        where: {
          NOT: {
            accountId: myMatching.accountId,
          },
        },
      });

      if (!matchingList) {
        console.log("매칭을 찾는 중입니다.");
        setInterval(() => interval, 1000);
      }

      // 매칭 상대 하나 정하기
      const randomMatching = Math.floor(Math.random() * matchingList.length);

      if(!matchingList[randomMatching]) {
        console.log("매칭을 찾는 중입니다.");
        setInterval(() => interval, 1000);
      }

      const vsMatching = await prisma.matching.findFirst({
        where: {
          accountId: matchingList[randomMatching].accountId,
        },
      });

      const vsRanking = await prisma.gameRankings.findFirst({
        where: {
          accountId: matchingList[randomMatching].accountId,
          rankScore: {
            gte: myRanking.rankScore - 500,
            lte: myRanking.rankScore + 500,
          },
        },
        orderBy: {
          rankScore: "desc",
        },
      });

      if (!vsRanking) {
        console.log("상대를 찾는 중입니다.");
        setInterval(() => interval, 1000);
      } else {
        console.log("상대를 찾았습니다!");
        await gameStart(
          accountId,
          vsRanking,
          myRanking,
          myMatching,
          vsMatching,
        );
        findCheck = true;
        clearInterval(interval);
      }
    }, 1000);

    setTimeout(() => {
      console.log('정산 중입니다.');
    }, 1000);
    
    return res.status(200).json({ message: "축구 게임 끝" });

  } catch (err) {
    next(err);
  }
});

async function gameStart(
  accountId,
  vsRanking,
  myRanking,
  myMatching,
  vsMatching,
) {
  // 매칭 상대와 게임하기
  // 매칭 상대의 팀 정보와 내 팀 정보를 불러와서 비교하기
  const mySquad = await prisma.squads.findMany({
    where: {
      accountId: accountId,
    },
  });

  const vsSquad = await prisma.squads.findMany({
    where: {
      accountId: vsRanking.accountId,
    },
  });

  // console.log(vsSquad[0].accountId);
  // console.log(mySquad[0].accountId);
  if (!mySquad || !vsSquad) {
    return res.status(400).json({ errorMessage: `구성된 팀이 없어요.` });
  }

  // 나의 팀 전투력 측정
  let mySquadPower = 0;
  for (let key in mySquad) {
    const { playerId } = mySquad[key];

    const player = await prisma.players.findFirst({
      where: { playerId: playerId },
    });

    const roster = await prisma.rosters.findFirst({
      where: {
        playerId: playerId,
        accountId: mySquad[0].accountId,
      },
    });

    // 밑에 0.3 , 0.5는 예시
    // 플레이어 레벨당 1개의 스텟이 1씩 오른다.
    mySquadPower +=
      player.PAC * 0.3 +
      player.DEF * 0.3 +
      player.SHO * 0.5 +
      player.DRI * 0.3 +
      player.PAS * 0.3 +
      player.PHY * 0.3;
  }

  // 상대 팀 전투력 측정
  let vsSquadPower = 0;
  for (let key in vsSquad) {
    const { playerId } = vsSquad[key];

    const player = await prisma.players.findFirst({
      where: { playerId: playerId },
    });

    const roster = await prisma.rosters.findFirst({
      where: {
        playerId: playerId,
        accountId: vsSquad[0].accountId,
      },
    });

    // 밑에 0.3 , 0.5는 예시
    vsSquadPower +=
    player.PAC * 0.3 +
    player.DEF * 0.3 +
    player.SHO * 0.5 +
    player.DRI * 0.3 +
    player.PAS * 0.3 +
    player.PHY * 0.3;
  }

  let myResult = "";
  let vsResult = "";
  
  let comparePower = (mySquadPower + vsSquadPower) * Math.random();
  if (comparePower < mySquadPower) {
    // 나의 팀이 승리
    myResult = "win";
    vsResult = "lose";
  } else if (comparePower === mySquadPower) {
    // 동점
    myResult, (vsResult = "draw");
  } else {
    // 상대 팀이 승리
    myResult = "lose";
    vsResult = "win";
  }

  await prisma.$transaction(async (tx) => {
    await tx.gameRankings.update({
      data: {
        playRecords:
          myRanking.playRecords !== null
            ? myRanking.playRecords + " " + [vsSquad[0].accountId, myResult]
            : [vsSquad[0].accountId, myResult],
        rankScore:
          myResult === "win"
            ? myRanking.rankScore + 50
            : myResult === "lose"
              ? myRanking.rankScore - 50
              : myRanking.rankScore,
      },
      where: {
        rankingId: myRanking.rankingId,
      },
    });

    await tx.gameRankings.update({
      data: {
        playRecords:
          vsRanking.playRecords !== null
            ? vsRanking.playRecords + " " + [mySquad[0].accountId, vsResult]
            : [mySquad[0].accountId, vsResult],
        rankScore:
          vsResult === "win"
            ? vsRanking.rankScore + 50
            : vsResult === "lose"
              ? vsRanking.rankScore - 50
              : vsRanking.rankScore,
      },
      where: {
        rankingId: vsRanking.rankingId,
      },
    });

    await tx.matching.delete({
      where: {
        matchingId: myMatching.matchingId,
      },
    });

    await tx.matching.delete({
      where: {
        matchingId: vsMatching.matchingId,
      },
    });
  });
}

export default router;
