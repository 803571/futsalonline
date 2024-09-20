import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default async function (req, res, next) {
  try {
    const authorizationHeader = req.headers["authorization"];

    //jwt로 세션 아이디 해제하기
    const [tokentype, token] = authorizationHeader.split(" ");
    if (tokentype !== "Bearer") {
      throw new Error("토큰 타입이 Bearer가 아님");
    }

    const saveId = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);

    if (!saveId) throw new Error("로그인이 필요합니다.");

    const { userId } = saveId;
    const account = await prisma.Accounts.findFirst({
      where: { userId: userId },
    });

    if (!account) throw new Error("토큰 사용자가 존재하지 않습니다.");

    req.account = account;
    next();
  } catch (error) {
    return res.status(401).json({ message: error });
  }
}
