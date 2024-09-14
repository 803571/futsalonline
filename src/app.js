import express from 'express';
import dotenv from 'dotenv';
import UsersRouter from './routes/users.router.js';
import CashRouter from './routes/cash.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

dotenv.config();

const app = express();
const PORT = 3333;

app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [UsersRouter, CashRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
