import express from 'express';
import http from 'http';
import cors from 'cors';
import { getClientPath, getLoginPath } from './utils/pathUtils.js';
import { setUpLobbyWebSoket } from './websokets/lobby.websoket.js';
import AccountsRouter from './routes/accounts.router.js';
import CashRouter from './routes/cash.router.js';
import PlayersRouter from './routes/players.router.js';
import RostersRouter from './routes/rosters.router.js';
import SquadsRouter from './routes/squads.router.js';
import MatchRouter from './routes/match.router.js';
import RankingRouter from './routes/ranking.router.js'
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const PORT = 3333;

const app = express();
const server = http.createServer(app);

setUpLobbyWebSoket(server);

const clientPath = getClientPath();
app.use(express.static(clientPath));

app.use(cors());
app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [AccountsRouter, CashRouter, PlayersRouter, RostersRouter, SquadsRouter, MatchRouter, RankingRouter]);
app.use(ErrorHandlingMiddleware);

app.get('/', (req, res) => {
  res.sendFile(getLoginPath());
});

server.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
