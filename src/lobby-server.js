import express from 'express';
import http from 'http';
import { getClientPath } from './utils/pathUtils.js';
import { setUpLobbyWebSoket } from './websokets/lobby.websoket.js';
import UsersRouter from './routes/users.router.js';
import CashRouter from './routes/cash.router.js';
import PlayersRouter from './routes/players.router.js';
import RostersRouter from './routes/rosters.router.js';
import ServerRouter from './routes/server.router.js'
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const PORT = 3333;

const app = express();
const server = http.createServer(app);

setUpLobbyWebSoket(server);

/*
app.post('/game-end', (req, res) => {
  const { port } = req.body;
  if (portStatus[port]) {
    portStatus[port] = 0;
    console.log(`${port} 포트가 해제되었습니다.`);
    res.status(200).send('포트 해제 완료');
  } else {
    res.status(400).send('잘못된 포트 번호');
  }
});
*/

const clientPath = getClientPath();
app.use(express.static(clientPath));

app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [UsersRouter, CashRouter, PlayersRouter, RostersRouter, ServerRouter]);
app.use(ErrorHandlingMiddleware);

server.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
