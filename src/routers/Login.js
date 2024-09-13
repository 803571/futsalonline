import express from "express";
import { prisma } from "../utils/prisma/index.js";
import joi from "joi";
import bcrypt from "bcrypt";

const schema = joi.object({
  id: joi.string().min(5).max(15).alphanum().required(),
  password: joi.string().min(5).max(15).alphanum().required(),
});

const router = express.Router();

router.post("/api/user", async (req, res, next) => {
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

  const hashedPassword = bcrypt.hash(password, 7);
  const newUser = await prisma.user.create({
    data:{
        id: id,
        password: hashedPassword,
    },
    select: {
         id: id,
    }
  })

  return res.status(201).json({message:`피파 온라인에 어서오세요. ${newUser}님`});
});

export default router;
