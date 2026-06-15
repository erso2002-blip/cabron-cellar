import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import {
  inviteGateMiddleware,
  setInviteCookie,
  clearInviteCookie,
} from "./middlewares/inviteGate";
import { clerkUserMiddleware } from "./middlewares/clerkUser";

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

// Clerk Frontend API proxy. Must be mounted before the body parsers because it
// streams raw bytes. Only active in production (no-op in dev).
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Resolve the publishable key from the request host so the same server can
// serve multiple Clerk custom domains, falling back to CLERK_PUBLISHABLE_KEY.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Invite gate: the "friends only" wall. /invite/grant is open so visitors can
// submit the code; everything else requires the invite cookie.
app.post("/api/invite/grant", setInviteCookie);
app.post("/api/invite/revoke", clearInviteCookie);
app.use("/api", inviteGateMiddleware);

// Per-user identity via Clerk — each signed-in user gets their own cellar.
app.use("/api", clerkUserMiddleware);
app.use("/api", router);

export default app;
