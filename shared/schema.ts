import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"), // "employee" or "manager"
  departmentId: integer("department_id").references(() => departments.id),
  dailyWorkHours: decimal("daily_work_hours", { precision: 4, scale: 2 }).notNull().default("8.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  entry1: text("entry1"), // HH:MM format
  exit1: text("exit1"),
  entry2: text("entry2"),
  exit2: text("exit2"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const justifications = pgTable("justifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  type: text("type").notNull(), // "absence", "late", "early-leave", "error"
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hourBank = pgTable("hour_bank", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM format
  expectedHours: decimal("expected_hours", { precision: 6, scale: 2 }).notNull(),
  workedHours: decimal("worked_hours", { precision: 6, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  timeRecords: many(timeRecords),
  justifications: many(justifications),
  hourBank: many(hourBank),
  approvedJustifications: many(justifications, { relationName: "approver" }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
}));

export const timeRecordsRelations = relations(timeRecords, ({ one }) => ({
  user: one(users, {
    fields: [timeRecords.userId],
    references: [users.id],
  }),
}));

export const justificationsRelations = relations(justifications, ({ one }) => ({
  user: one(users, {
    fields: [justifications.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [justifications.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const hourBankRelations = relations(hourBank, ({ one }) => ({
  user: one(users, {
    fields: [hourBank.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJustificationSchema = createInsertSchema(justifications).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
});

export const insertHourBankSchema = createInsertSchema(hourBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type Justification = typeof justifications.$inferSelect;
export type InsertJustification = z.infer<typeof insertJustificationSchema>;
export type HourBank = typeof hourBank.$inferSelect;
export type InsertHourBank = z.infer<typeof insertHourBankSchema>;
