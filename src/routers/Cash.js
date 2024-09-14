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
            type: "get",
        }
    })

    checkandSaveCash2(accountId);

    return res.status(200).json({message: '성공적으로 캐시를 구매했습니다.'});
})

// 거래 금액 내역을 조회하고 내역을 지우며 현재 남은 캐시를 CashDatasets 테이블에 저장해주는 함수입니다.
async function checkandSaveCash(accountId) {
    // 금액을 저장할 변수입니다.
    let total = 10000;

    // 자신의 계정에 해당하는 캐시 로그를 전부다 조회합니다.
    const CashTable = await prisma.CashDatasets.findMany({
        where: {accountId: accountId},
        orderBy: {createdAt: 'asc'},
    })

    if(!CashTable) {
        console.log(`현재 존재하는 캐시 로그가 없습니다.`);
        return
    }
   // console.log(CashTable);

   // 조회된 캐시로그들을 순회하며 
    for(let key in CashTable) {
        const {cashDatasetId, amount,type} = CashTable[key];
        // 각각의 처리 타입에 따라서 연산을 해줍니다.
        switch (type) {
            case "get":
                total += amount;
                break;
            case "save": //type에 save가 있다면 
                total = amount; //해당 데이터를 불러와 저장합니다.
                break;
            default:
                total -= amount;
                break;
        }

        // 조회된 데이터는 필요없으니 삭제합니다.
        await prisma.cashDatasets.delete({
            where: {
                cashDatasetId: +cashDatasetId,
            }
        })
    }

    // 조회된 데이터를 순회한 후 저장된 total 값을 save type으로 저장합니다.
    // 이렇게 저장하게되면 일일이 모든 리스트를 조회할 필요가 없이
    // 단축하여 저장할 수 있지만, 모든 로그가 날아가는 단점이 있습니다.
    await prisma.cashDatasets.create({
        data: {
            accountId: accountId,
            amount: total,
            type: "save",
            description: "saveCash",
        }
    })
    
    console.log(total);
}


// 거래 금액 내역을 조회하며 현재 남은 캐시를 CashDatasets 테이블에 저장해주는 함수입니다.
async function checkandSaveCash2(accountId) {
    // 금액을 저장할 변수입니다.
    
    // 자신의 계정에서
    const saveCash = await prisma.CashDatasets.findFirst({
        where: {
            accountId: accountId,
            type: "save",
        },
        orderBy: {createdAt: 'desc'}, // 내림차순으로 정리하게되면 13,12,11,10,9....
        // 이중에서 가장 처음 있는 saveCash를 뽑게되면 가장 마지막에
        // 저장된 캐시 로그가 됨
    })

    let total = saveCash?saveCash.amount:10000; // 그 캐시 값을 저장
    let cashIdArr = []; // 캐시 id를 저장

    //save가 있다면 
    const CashTable = saveCash? await prisma.CashDatasets.findMany({
        where: {
                accountId: accountId,
                cashDatasetId: {
                    //cash데이터 테이블에서 cashDatasetId보다 큰 값 전부를 조회하겠다.
                    gt: saveCash.cashDatasetId, 
                }
        },
        orderBy: {createdAt: 'asc'}
    })
    : //save 값이 없다면 모든걸 조회한다.
    await prisma.CashDatasets.findMany({
        where: {
                accountId: accountId,
        },
        orderBy: {createdAt: 'asc'}
    }) 

    // 현재 갱신되어있는 값이 존재하지 않아요.
    if(!CashTable) {
        console.log('갱신할 정보가 없다.');
       return;
    }
      
   // 조회된 캐시로그들을 순회하며 
    for(let key in CashTable) {
        const {cashDatasetId, amount,type} = CashTable[key];
        // 각각의 처리 타입에 따라서 연산을 해줍니다.
        switch (type) {
            case "get":
                total += amount;
                break;
            case "save": //type에 save가 있다면 
                total = amount; //해당 데이터를 불러와 저장합니다.
                break;
            default:
                total -= amount;
                break;
        }

       cashIdArr.push(cashDatasetId);
    }

    cashIdArr = cashIdArr.join('');

    // 조회된 데이터를 순회한 후 저장된 total 값을 save type으로 저장합니다.
    // 이렇게 저장하게되면 일일이 모든 리스트를 조회할 필요가 없이
    // 단축하여 저장할 수 있지만, 모든 로그가 날아가는 단점이 있습니다.
    await prisma.cashDatasets.create({
        data: {
            accountId: accountId,
            amount: total,
            type: "save",
            description: `merge ${cashIdArr}`,
        }
    })
    
    console.log(total);
}

export default router;