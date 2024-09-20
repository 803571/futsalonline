import express from 'express';
import portUtil from '../utils/portUtils.js';

const router = express.Router();

router.post('/game-end', (req, res, next) => {
  const { port } = req.body;

  try {
    if (port) {
      portUtil.setPortStatus(port, 0);
      console.log(`${port} 포트가 다시 사용 가능합니다.`);
      res.status(200).json({ message: '게임이 종료되었습니다. 로비로 이동합니다.', redirectUrl: '/lobby.html' });
    } else {
      res.status(400).json({ errorMessage: '포트가 지정되지 않았습니다.' });
    }
  } catch (err){
    next(err);
  }
});

export default router;
