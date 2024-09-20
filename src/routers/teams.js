import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.post('/entry/:playerId' ,authSigninMiddleware, async(req,res,next) => {
   const {accountId} = req.account;
   const {playerId} = req.params;

   const roster = await prisma.rosters.findFirst({
    where: {
        playerId: +playerId,
        accountId: +accountId,
    }
   })

   if(!roster) {
    return res.status(400).json({errorMessage: `해당하는 플레이어가 로스터에 존재하지 않습니다.`});
   }

   const team = await prisma.teams.findFirst({
    where: {
        playerId: +playerId,
    }
   })

   console.log(team);
   if(team) {
      return res.status(400).json({errorMessage: `동일한 플레이어를 팀에 여러명 편성할 수는 없습니다.`});
   }

   const player = await prisma.players.findFirst({
     where: {
        playerId: roster.playerId,
     }
   })

   await prisma.$transaction(async (tx) => {
     if(roster.amount === 1) {
        await tx.rosters.delete({
            where: {
                playerId: roster.playerId,
                accountId: roster.accountId,
                rosterId: roster.rosterId,
            }
        })
     }
     else {
        await tx.rosters.update({
            data: {
               amount: roster.amount - 1,
            },
            where: {
                playerId: roster.playerId,
                accountId: roster.accountId,
                rosterId: roster.rosterId,
            }
        })
     }
     
     await tx.teams.create({
        data: {
            accountId: roster.accountId,
            playerId: roster.playerId,
            position: 'MD',
        }
     })
   })

   return res.status(200).json({message: `${player.playerId}가 팀에 추가되었습니다.`});
})

export default router;