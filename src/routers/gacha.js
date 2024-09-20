import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.post(
  "/gacha/:playerId",
  authSigninMiddleware,
  async (req, res, next) => {
    const { accountId } = req.account;
    const { playerId } = req.params;

    const wantedPlayer = await prisma.players.findFirst({
      where: {
        playerId: +playerId,
      },
    });

    // const playerTable = await prisma.players.findMany({
    //     where: {
    //         //position: wantedPlayer.position

    //     }
    // })

    if (!wantedPlayer) {
      return res
        .status(400)
        .json({ errorMessage: `번호에 해당하는 선수가 존재하지 않습니다.` });
    }

    const roster = await prisma.rosters.findFirst({
        where: {
            playerId: wantedPlayer.playerId,
            accountId: accountId,
        }
      })

    await prisma.$transaction(async (tx) => {
      
      await tx.cashDatasets.create({
        data: {
          accountId: accountId,
          amount: 1000,
          type: "use",
          description: "use 1000",
        },
      });

      if(roster) {
        await tx.rosters.update({
            data: {
                amount: roster.amount + 1,
            },
            where: {
                playerId: wantedPlayer.playerId,
                accountId: accountId,
                rosterId: roster.rosterId,
            }
        })
      }
      else {
        await tx.rosters.create({
            data: {
              accountId: accountId,
              playerId: wantedPlayer.playerId,
            },
          });
      }  
    });

    return res.status(200).json({ message: `카드 영입에 성공했습니다.` });
  },
);
export default router;
