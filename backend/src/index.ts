import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import providersRoute from "./routes/providers";
import runRoute from "./routes/run";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
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
