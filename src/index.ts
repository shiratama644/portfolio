import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// public をそのまま配信
app.use(express.static(path.join(__dirname, "../public")));

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});