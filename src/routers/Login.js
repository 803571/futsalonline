import express from "express";
import { prisma } from "../utils/prisma/index.js";
import joi from "joi";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const schema = joi.object({
    
    //Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,20}$")).required()
  id: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,15}$")).required(),
  password: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,20}$")).required(),
});

const router = express.Router();

// 회원 가입
router.post("/user", async (req, res, next) => {
  const { id, password } = req.body;

  try {
    await schema.validateAsync({ id, password });
  } catch (err) {
    return res.status(400).json({ err });
  }

  const isUser = await prisma.findFirst({
    where: { id: id },
  });

  if(isUser) {
     return res.status(400).json({errorMessage: '중복된 이름입니다.'});
  }

  const hashedPassword = bcrypt.hash(password, 15);
  const newUser = await prisma.user.create({
    data:{
        id: id,
        password: hashedPassword,
    },
  })

  return res.status(201).json({message:`피파 온라인에 오신걸 환영합니다. ${newUser.id}님`});
});

// 로그인 기능
router.post('/user/login', async (req,res,next) => {
    const {id,password} = req.body;

    const user = await prisma.user.findFirst({
        where: {id: id},
    })

    if(!user) {
        return res.status(400).json({errorMessage: '해당하는 유저가 존재하지 않습니다.'});
    }

    if (!(await bcrypt.compare(password, user.password))) {
        return res
            .status(401)
            .json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const accessToken = jwt.sign({id}, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: "1d"
    })

    res.header("Authorization", `Bearer ${accessToken}`);

    return res.status(200).json({message: `${user.id}님이 로그인하셨습니다.`});
})
export default router;
