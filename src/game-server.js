import express from 'express';
import http from 'http';
import { getClientPath } from './utils/pathUtils.js';
import { setUpGameWebSoket } from './websokets/game.websoket.js';
import portUtil from './utils/portUtils.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const server = http.createServer(app);

const clientPath = getClientPath();
app.use(express.static(clientPath));

app.use(LogMiddleware);
app.use(express.json());

//app.use('/api', [ServerRouter]);
app.use(ErrorHandlingMiddleware);

const PORT = portUtil.findAvailablePort(); 

setUpGameWebSoket(server, PORT);

server.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
