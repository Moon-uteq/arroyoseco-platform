import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// Prefijo de API
app.use("/api", authRouter);

// Salud
app.get("/", (_req, res) => res.json({ ok: true, service: "auth-api" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth API escuchando en http://localhost:${PORT}`);
});
