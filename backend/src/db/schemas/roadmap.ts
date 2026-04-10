import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const roadmaps = sqliteTable(
  "roadmaps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("idx_roadmaps_user_id").on(table.userId)],
);

export const nodes = sqliteTable(
  "nodes",
  {
    id: text("id").primaryKey(),
    roadmapId: text("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("not_started"),
    orderIndex: integer("order_index").notNull().default(0),
    positionX: real("position_x"),
    positionY: real("position_y"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_nodes_roadmap_id").on(table.roadmapId),
    check(
      "nodes_status_check",
      sql`${table.status} IN ('not_started', 'in_progress', 'completed')`,
    ),
  ],
);

export const edges = sqliteTable(
  "edges",
  {
    id: text("id").primaryKey(),
    roadmapId: text("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    targetId: text("target_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_edges_roadmap_id").on(table.roadmapId),
    uniqueIndex("edges_source_id_target_id_unique").on(table.sourceId, table.targetId),
  ],
);
