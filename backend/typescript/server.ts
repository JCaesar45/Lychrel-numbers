/**
 * The Lychrel Archive — HTTP API
 * Express + TypeScript. Endpoints:
 *   GET  /api/health
 *   GET  /api/analyze/:seed
 *   POST /api/analyze      { seed, limit? }
 *   GET  /api/seeds
 */
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { analyze, isLychrel, ITERATION_LIMIT } from "./lychrel";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "8kb" }));

const limiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "lychrel-archive",
    iterationLimit: ITERATION_LIMIT,
    now: new Date().toISOString(),
  });
});

app.get("/api/seeds", (_req: Request, res: Response) => {
  res.json({
    below10k: ["196", "879", "1997", "7059", "9999"],
    canonical: "196",
  });
});

function validateSeed(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const s = String(raw).trim();
  if (!/^[0-9]+$/.test(s) || /^0+$/.test(s)) return null;
  return s;
}

app.get("/api/analyze/:seed", (req: Request, res: Response) => {
  const seed = validateSeed(req.params.seed);
  if (!seed) {
    return res.status(400).json({ error: "seed must be a positive integer" });
  }
  try {
    const result = analyze(seed);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/analyze", (req: Request, res: Response) => {
  const seed = validateSeed(req.body?.seed);
  if (!seed) {
    return res.status(400).json({ error: "body.seed must be a positive integer" });
  }
  const limit = Number(req.body?.limit ?? ITERATION_LIMIT);
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
    return res.status(400).json({ error: "limit must be 1..5000" });
  }
  try {
    const result = analyze(seed, limit);
    return res.json({ ...result, isLychrel: isLychrel(seed) });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Centralised error handler.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[api] unhandled:", err);
  res.status(500).json({ error: "internal error" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[lychrel-archive] listening on http://localhost:${PORT}`);
});
