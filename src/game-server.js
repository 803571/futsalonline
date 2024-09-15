import express from 'express';
import ServerRouter from './routes/server.router.js'
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 4444;

app.use(LogMiddleware);
app.use(express.json());

app.use('/api', [ServerRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});