import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("inactive"),
    currentPeriodEnd: integer("current_period_end", { mode: "number" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    check("subscriptions_plan_check", sql`${table.plan} IN ('free', 'pro')`),
    check(
      "subscriptions_status_check",
      sql`${table.status} IN ('active', 'inactive', 'canceled', 'past_due')`,
    ),
  ],
);
