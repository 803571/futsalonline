import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

// 전체 랭크 조회 (상위 랭크 조회도 가능)
router.get('/rank', async(req,res,next) => {
    const rank = await prisma.gameRankings.findMany({
        select: {
           accountId: true,
           winningRate: true,
           rankScore: true,
           playRecords: true,
        },
        orderBy: {rankScore: 'desc'},
    })

    if(!rank) {
        return res.status(400).json({errorMessage: `현재 등록된 랭킹 정보가 없습니다.`});
    }

    // 정렬 되어 있는 rank에서 key 값을 뽑음 => 순서대로 랭킹 정렬
    let saveRankings = [];

    for(let key in rank) {
        const ranking = +key;
        const rankInfo = rank[key];
        saveRankings.push([ranking + 1,rankInfo]);
    }

    return res.status(200).json({data: saveRankings});
})

router.get('/userRank',authSigninMiddleware, async(req,res,next) => {
    const {accountId} = req.account;

    const Accounts = await prisma.accounts.findFirst({
        where: {
            accountId: accountId,
        },
        select: {
            userId: true,
        }
    })
    const myRank = await prisma.gameRankings.findFirst({
        where: {
            accountId: +accountId,
        }
    })

    const rank = await prisma.gameRankings.findMany({
        select: {
           accountId: true,
           winningRate: true,
           rankScore: true,
           playRecords: true,
        },
        orderBy: {rankScore: 'desc'},
    })

    //console.log(rank);
    let ranking = 0;
    let saveRankings = [];

    for(let key in rank) {
        const {accountId} = rank[key];

        if(accountId !== myRank.accountId) {
            continue;
        }
        else {
            ranking = +key;
            saveRankings.push([ranking + 1,Accounts.userId, rank[key]]);
            break;
        }

    }
    
    console.log(saveRankings[0][1]);
    return res.status(200).json({data: saveRankings});
    
})
export default router;