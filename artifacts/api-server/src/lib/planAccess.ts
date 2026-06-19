import { and, db, eq, sql, winesTable } from "@workspace/db";
import type { PublicUser } from "../types/express.js";
import { billingPlans } from "./billingPlans.js";

const FREE_PLAN = billingPlans.find((plan) => plan.id === "free");

function splitEnvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isProUser(user: PublicUser | null) {
  if (!user) return false;
  if (process.env.MYCELLAR_DEFAULT_PLAN?.toLowerCase() === "pro") return true;

  const proEmails = splitEnvList(process.env.MYCELLAR_PRO_EMAILS);
  const proUserIds = splitEnvList(process.env.MYCELLAR_PRO_USER_IDS);
  const email = user.email?.toLowerCase() ?? "";
  const userId = user.id.toLowerCase();

  return (email && proEmails.includes(email)) || proUserIds.includes(userId);
}

export function getFreeBottleLimit() {
  return FREE_PLAN?.bottlesLimit ?? 30;
}

export function requireProFeature(user: PublicUser | null, feature: string) {
  if (isProUser(user)) return null;

  return {
    status: 402,
    body: {
      error: "Pro plan required",
      feature,
      upgradeRequired: true,
    },
  };
}

export async function getPresentBottleCount(userId: string) {
  const [totals] = await db
    .select({
      totalBottles: sql<number>`COALESCE(SUM(${winesTable.quantity}), 0)::int`,
    })
    .from(winesTable)
    .where(and(eq(winesTable.userId, userId), sql`${winesTable.quantity} > 0`));

  return totals?.totalBottles ?? 0;
}
