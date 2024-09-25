import express from "express";
import dotenv from "dotenv";
import EntryRouter from "./routes/entry.router.js";
import LogMiddleware from "./middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import user from "./routes/users.router.js";

dotenv.config();

const app = express();
const PORT = 3333;

app.use(LogMiddleware);
app.use(express.json());

app.use("/api", [EntryRouter, user]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸습니다!");
});
