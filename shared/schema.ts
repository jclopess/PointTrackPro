import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date } from "drizzle-orm/pg-core";
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

// Functions table
export const functions = pgTable("functions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employment types table
export const employmentTypes = pgTable("employment_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  dailyWorkHours: decimal("daily_work_hours", { precision: 4, scale: 2 }).notNull().default("8.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset requests table
export const passwordResetRequests = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  cpf: text("cpf").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // "pending", "resolved"
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("employee"), // "employee", "manager", "admin"
  departmentId: integer("department_id").references(() => departments.id),
  functionId: integer("function_id").references(() => functions.id),
  employmentTypeId: integer("employment_type_id").references(() => employmentTypes.id),
  admissionDate: date("admission_date"),
  dismissalDate: date("dismissal_date"),
  status: text("status").notNull().default("active"), // "active", "blocked", "inactive"
  dailyWorkHours: decimal("daily_work_hours", { precision: 4, scale: 2 }).notNull().default("8.00"),
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

// Functions relations
export const functionsRelations = relations(functions, ({ many }) => ({
  users: many(users),
}));

// Employment types relations
export const employmentTypesRelations = relations(employmentTypes, ({ many }) => ({
  users: many(users),
}));

// Password reset requests relations
export const passwordResetRequestsRelations = relations(passwordResetRequests, ({ one }) => ({
  resolvedBy: one(users, {
    fields: [passwordResetRequests.resolvedBy],
    references: [users.id],
  }),
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
  function: one(functions, {
    fields: [users.functionId],
    references: [functions.id],
  }),
  employmentType: one(employmentTypes, {
    fields: [users.employmentTypeId],
    references: [employmentTypes.id],
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

export const insertFunctionSchema = createInsertSchema(functions).omit({
  id: true,
  createdAt: true,
});

export const insertEmploymentTypeSchema = createInsertSchema(employmentTypes).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequests).omit({
  id: true,
  requestedAt: true,
  status: true,
  resolvedBy: true,
  resolvedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve ter o formato 000.000.000-00"),
  phone: z.string().optional(),
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

export type Function = typeof functions.$inferSelect;
export type InsertFunction = z.infer<typeof insertFunctionSchema>;

export type EmploymentType = typeof employmentTypes.$inferSelect;
export type InsertEmploymentType = z.infer<typeof insertEmploymentTypeSchema>;

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = z.infer<typeof insertPasswordResetRequestSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type Justification = typeof justifications.$inferSelect;
export type InsertJustification = z.infer<typeof insertJustificationSchema>;
export type HourBank = typeof hourBank.$inferSelect;
export type InsertHourBank = z.infer<typeof insertHourBankSchema>;