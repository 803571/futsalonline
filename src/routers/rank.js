import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

// 전체 랭크 조회 (상위 랭크 조회도 가능)
router.get('/rank', async(req,res,next) => {
    const rank = await prisma.gameRankings.findMany({
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

    return res.status(400).json({data: saveRankings});
})

router.get('/userRank',authSigninMiddleware, async(req,res,next) => {
    const {accountId} = req.account;

    const myRank = await prisma.gameRankings.findFirst({
        where: {
            accountId: +accountId,
        }
    })

    const rank = await prisma.gameRankings.findMany({
        orderBy: {rankScore: 'desc'},
    })

    //console.log(rank);
    let ranking = 0;
    for(let key in rank) {
        const {accountId} = rank[key];

        if(accountId !== myRank.accountId) {
            continue;
        }
        else {
            ranking = key;
        }

    }
    //console.log(rank.indexOf(myRank.accountId));

    console.log(ranking);
    return res.status(200).json({data: [+ranking + 1, myRank]});
    
})
export default router;