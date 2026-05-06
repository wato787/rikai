import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const billingAccounts = sqliteTable("billing_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  creditBalance: integer("credit_balance", { mode: "number" }).notNull().default(0),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});
