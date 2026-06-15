import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import {
  inviteGateMiddleware,
  setInviteCookie,
  clearInviteCookie,
} from "./middlewares/inviteGate";
import { sharedUserMiddleware } from "./middlewares/sharedUser";

const app: Express = express();

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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(authMiddleware);

// Invite gate: POST /api/invite/grant (open) + all other /api/* routes protected.
// After the gate, every visitor shares one cellar identity (MVP — no Replit login).
app.post("/api/invite/grant", setInviteCookie);
app.post("/api/invite/revoke", clearInviteCookie);
app.use("/api", inviteGateMiddleware);
app.use("/api", sharedUserMiddleware);
app.use("/api", router);

export default app;
