import express from 'express';
import cookieParser from 'cookie-parser';
import AccountsRouter from './routes/accounts.router.js';
import ClubsRouter from './routes/clubs.router.js';
import CardsRouter from './routes/cards.router.js';
import GachaRouter from './routes/gacha.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 3333;

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use('/api', [AccountsRouter, ClubsRouter, GachaRouter, CardsRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다.');
});
