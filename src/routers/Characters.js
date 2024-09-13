import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 선수 데이터 준비
router.post('/characters', async(req,res,next) => {
    const updateChar = req.body;

    const character = await prisma.character.findFirst({
        where: {
            charId: updateChar.charId, // 이 부분에서
            //현재 ERD에서는 charId가 자동 생성인데, 아마도 임의로 지정하면 좋겠네요.
        }
    })
    
    if(character) {
        //throw new Error(err)에 try로 감싸서
        //next(err)로 다음 방식으로 처리해도됨
        //캐릭터나 각종 다른 기능 별로 다 다른 에러처리 미들웨어를 만들 필요성이 생길수도 있다.. ㅇㅇ...
        return res.status(400).json({errorMessage: '해당 캐릭터가 존재함'});
    }

    const newChar = await prisma.character.create({
        data: {
            ...updateChar,
        }
    })

    return res.status(201).json({message:`${newChar.charName}의 생성에 완료했습니다.`})
} )

export default router;