import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import "./types/express.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { googleAuthMiddleware } from "./middlewares/googleAuth.js";
import { corsOrigin, securityHeaders } from "./middlewares/security.js";

const app = express();
app.disable("x-powered-by");

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

app.use(securityHeaders);
app.use(cors({ credentials: false, origin: corsOrigin }));
app.use(cookieParser());
app.use(express.json({ limit: "7mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", googleAuthMiddleware);
app.use("/api", router);

export default app;
