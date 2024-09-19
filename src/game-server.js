import express from 'express';
import http from 'http';
import { getClientPath } from './utils/pathUtils.js';
import { setUpGameWebSoket } from './websokets/game.websoket.js';
import ServerRouter from './routes/server.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const PORT = 4444;

const app = express();
const server = http.createServer(app);

setUpGameWebSoket(server);

const clientPath = getClientPath();
app.use(express.static(clientPath));

app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [ServerRouter]);
app.use(ErrorHandlingMiddleware);

server.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
