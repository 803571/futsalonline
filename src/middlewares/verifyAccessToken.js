// src/middlewares/verifyAccessToken.js
import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send("토큰이 필요합니다.");
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};
