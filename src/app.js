import express from "express";

const app = express();
const PORT = 4444;

app.use('/', []);
app.listen(PORT, () => {
    console.log(PORT, '로 서버가 열렸습니다.');
})