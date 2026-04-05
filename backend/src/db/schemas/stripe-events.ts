import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Stripe Webhook の冪等処理用（同一 event.id の再処理を防ぐ） */
export const processedStripeEvents = sqliteTable("processed_stripe_events", {
  eventId: text("event_id").primaryKey(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});
