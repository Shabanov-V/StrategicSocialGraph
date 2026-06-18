import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { initDb } from "./db.js";
import authRouter from "./auth.js";
import graphRouter from "./graph.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/graph", graphRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start(): Promise<void> {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
