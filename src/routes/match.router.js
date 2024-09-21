import express from 'express';
import portUtil from '../utils/portUtils.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/game-end', (req, res, next) => {
  const { port } = req.body;
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ errorMessage: 'Authorization header가 없습니다.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ errorMessage: '토큰이 유효하지 않습니다.' });
    }

    try {
      if (port) {
        portUtil.setPortStatus(port, 0);
        console.log(`${port} 포트 다시 사용 가능. 유저 ID: ${decoded.userId}`);
        res.status(200).json({
          message: '게임이 종료되었습니다. 로비로 이동합니다.',
          redirectUrl: 'http://localhost:3333/lobby.html',
        });
      } else {
        res.status(400).json({ errorMessage: '포트가 지정되지 않았습니다.' });
      }
    } catch (err) {
      next(err);
    }
  });
});

export default router;
