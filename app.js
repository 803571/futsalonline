import express from 'express';
import cash from './src/routers/cash.js';
import login from './src/routers/Login.js';
import soccer from './src/routers/soccer.js';
import lvUp from './src/routers/playerLvUp.js';
import rank from './src/routers/rank.js';
import dotenv from 'dotenv';
import LogMiddleware from './src/middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './src/middlewares/error-handling.middleware.js';

dotenv.config();

const app = express();
const PORT = 3333;

app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [login,cash,soccer,lvUp,rank]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});