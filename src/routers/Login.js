import express from "express";
import { prisma } from "../utils/prisma/index.js";
import joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const schema = joi.object({
  userId: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,15}$")).required(),
  password: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{5,20}$")).required(),
});

const router = express.Router();

// 회원 가입
router.post("/sign", async (req, res, next) => {
  const { userId, password } = req.body;

  try {
    await schema.validateAsync({ userId, password });
  } catch (err) {
    return res.status(400).json({ err });
  }

  const Account = await prisma.Accounts.findFirst({
    where: { userId: userId },
  });

  if(Account) {
     return res.status(400).json({errorMessage: '중복된 이름입니다.'});
  }

  const hashedPassword = await bcrypt.hash(password, 15);

  const newAccount = await prisma.Accounts.create({
    data:{
      userId: userId,
        password: hashedPassword,
    },
  })

  return res.status(201).json({message:`피파 온라인에 오신걸 환영합니다. ${newAccount.userId}님`});
});

// 로그인 기능
router.post('/login', async (req,res,next) => {
    const {userId,password} = req.body;

    const account = await prisma.Accounts.findFirst({
        where: {userId: userId},
    })

    if(!account) {
        return res.status(400).json({errorMessage: '해당하는 유저가 존재하지 않습니다.'});
    }

    if (!(await bcrypt.compare(password, account.password))) {
        return res
            .status(401)
            .json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: "1d"
    })

    res.header("Authorization", `Bearer ${accessToken}`);

    return res.status(200).json({message: `${account.userId}님이 로그인하셨습니다.`});
})
export default router;
