import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import providersRoute from "./routes/providers";
import runRoute from "./routes/run";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* ✅ REGISTER ROUTES FIRST */
app.use("/providers", providersRoute);
app.use("/run", runRoute);

/* ✅ START SERVER LAST */
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
