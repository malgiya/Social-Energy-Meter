import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interactionsTable = pgTable("interactions", {
  id: serial("id").primaryKey(),
  personName: text("person_name").notNull(),
  interactionType: text("interaction_type").notNull(),
  energyBefore: integer("energy_before").notNull(),
  energyAfter: integer("energy_after").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInteractionSchema = createInsertSchema(interactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactionsTable.$inferSelect;
