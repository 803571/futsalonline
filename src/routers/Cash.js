import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authSigninMiddleware from "../middlewares/auth.signin.middleware.js";

const router = express.Router();

router.post('/cash',authSigninMiddleware, async(req,res,next) => {
   const {accountId} = req.account;
   const updateCash = req.body;

   
    const newCashData = await prisma.CashDatasets.create({
        data: {
            accountId: +accountId,
            ...updateCash,
        }
    })

   checkCash(accountId);

    return res.status(200).json({message: '성공적으로 캐시를 구매했습니다.'});
})

async function checkCash(accountId) {
    // 1. 거래 금액과 거래 유형을 전부 불러온다.
    // 2. 순회하면서 현 캐시를 계산한다. (캐릭터가 가진 캐시 10000)

    let total = 0;

    const CashTable = await prisma.CashDatasets.findMany({
        where: {accountId: accountId},
        orderBy: {createdAt: 'asc'},
    })

    for(let key in CashTable) {
        const {amount,type} = CashTable[key];
        if(type === "get") {
           total += amount;
        }
        else {
            total -= amount;
        }
    }

    console.log(10000 + total);
}

export default router;