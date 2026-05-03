import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const app: Express = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

app.use("/api", apiLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Resolve __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from the built frontend (production) or Vite dev server (if running)
const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist", "public");
app.use(express.static(frontendDist));

// For SPA routing, serve index.html for any unmatched routes
// Updated catch-all route to avoid path-to-regexp error in Express 5
// Use a middleware fallback instead of a route pattern that triggers path-to-regexp parsing.
app.use((req: Request, res: Response) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
