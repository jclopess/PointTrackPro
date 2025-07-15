import { departments, users, timeRecords, justifications, hourBank, type Department, type InsertDepartment, type User, type InsertUser, type TimeRecord, type InsertTimeRecord, type Justification, type InsertJustification, type HourBank, type InsertHourBank } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllEmployees(): Promise<(User & { department: Department | null })[]>;

  // Time record methods
  getTimeRecord(userId: number, date: string): Promise<TimeRecord | undefined>;
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  updateTimeRecord(id: number, record: Partial<InsertTimeRecord>): Promise<TimeRecord | undefined>;
  getTimeRecordsForUser(userId: number, month?: string): Promise<TimeRecord[]>;
  getAllTimeRecordsForDate(date: string): Promise<(TimeRecord & { user: User })[]>;

  // Justification methods
  createJustification(justification: InsertJustification): Promise<Justification>;
  getJustificationsForUser(userId: number): Promise<Justification[]>;
  getPendingJustifications(): Promise<(Justification & { user: User })[]>;
  approveJustification(id: number, approverId: number, approved: boolean): Promise<Justification | undefined>;

  // Hour bank methods
  getHourBank(userId: number, month: string): Promise<HourBank | undefined>;
  createOrUpdateHourBank(hourBank: InsertHourBank): Promise<HourBank>;
  calculateHourBank(userId: number, month: string): Promise<HourBank>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.isActive, true));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async updateDepartment(id: number, updateDepartment: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db
      .update(departments)
      .set(updateDepartment)
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllEmployees(): Promise<(User & { department: Department | null })[]> {
    return await db
      .select()
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(eq(users.status, "active"), eq(users.role, "employee")))
      .then(results => results.map(result => ({
        ...result.users,
        department: result.departments
      })));
  }

  async getTimeRecord(userId: number, date: string): Promise<TimeRecord | undefined> {
    const [record] = await db
      .select()
      .from(timeRecords)
      .where(and(eq(timeRecords.userId, userId), eq(timeRecords.date, date)));
    return record || undefined;
  }

  async createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord> {
    const [timeRecord] = await db
      .insert(timeRecords)
      .values({
        ...record,
        updatedAt: new Date(),
      })
      .returning();
    return timeRecord;
  }

  async updateTimeRecord(id: number, record: Partial<InsertTimeRecord>): Promise<TimeRecord | undefined> {
    const [timeRecord] = await db
      .update(timeRecords)
      .set({
        ...record,
        updatedAt: new Date(),
      })
      .where(eq(timeRecords.id, id))
      .returning();
    return timeRecord || undefined;
  }

  async getTimeRecordsForUser(userId: number, month?: string): Promise<TimeRecord[]> {
    let conditions = [eq(timeRecords.userId, userId)];
    
    if (month) {
      conditions.push(sql`substr(${timeRecords.date}, 1, 7) = ${month}`);
    }
    
    return await db
      .select()
      .from(timeRecords)
      .where(and(...conditions))
      .orderBy(desc(timeRecords.date));
  }

  async getAllTimeRecordsForDate(date: string): Promise<(TimeRecord & { user: User })[]> {
    return await db
      .select()
      .from(timeRecords)
      .innerJoin(users, eq(timeRecords.userId, users.id))
      .where(eq(timeRecords.date, date))
      .then(results => results.map(result => ({
        ...result.time_records,
        user: result.users
      })));
  }

  async createJustification(justification: InsertJustification): Promise<Justification> {
    const [newJustification] = await db
      .insert(justifications)
      .values(justification)
      .returning();
    return newJustification;
  }

  async getJustificationsForUser(userId: number): Promise<Justification[]> {
    return await db
      .select()
      .from(justifications)
      .where(eq(justifications.userId, userId))
      .orderBy(desc(justifications.createdAt));
  }

  async getPendingJustifications(): Promise<(Justification & { user: User })[]> {
    return await db
      .select()
      .from(justifications)
      .innerJoin(users, eq(justifications.userId, users.id))
      .where(eq(justifications.status, "pending"))
      .orderBy(desc(justifications.createdAt))
      .then(results => results.map(result => ({
        ...result.justifications,
        user: result.users
      })));
  }

  async approveJustification(id: number, approverId: number, approved: boolean): Promise<Justification | undefined> {
    const [justification] = await db
      .update(justifications)
      .set({
        status: approved ? "approved" : "rejected",
        approvedBy: approverId,
        approvedAt: new Date(),
      })
      .where(eq(justifications.id, id))
      .returning();
    return justification || undefined;
  }

  async getHourBank(userId: number, month: string): Promise<HourBank | undefined> {
    const [hourBankRecord] = await db
      .select()
      .from(hourBank)
      .where(and(eq(hourBank.userId, userId), eq(hourBank.month, month)));
    return hourBankRecord || undefined;
  }

  async createOrUpdateHourBank(hourBankData: InsertHourBank): Promise<HourBank> {
    const existing = await this.getHourBank(hourBankData.userId, hourBankData.month);
    
    if (existing) {
      const [updated] = await db
        .update(hourBank)
        .set({
          ...hourBankData,
          updatedAt: new Date(),
        })
        .where(eq(hourBank.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(hourBank)
        .values(hourBankData)
        .returning();
      return created;
    }
  }

  async calculateHourBank(userId: number, month: string): Promise<HourBank> {
    // Get user's daily work hours
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Get all time records for the month
    const records = await this.getTimeRecordsForUser(userId, month);
    
    // Calculate total worked hours
    let workedHours = 0;
    for (const record of records) {
      if (record.totalHours) {
        workedHours += parseFloat(record.totalHours);
      }
    }

    // Calculate expected hours (working days * daily hours)
    const workingDays = this.getWorkingDaysInMonth(month);
    const expectedHours = workingDays * parseFloat(user.dailyWorkHours);
    const balance = workedHours - expectedHours;

    const hourBankData: InsertHourBank = {
      userId,
      month,
      expectedHours: expectedHours.toString(),
      workedHours: workedHours.toString(),
      balance: balance.toString(),
    };

    return await this.createOrUpdateHourBank(hourBankData);
  }

  private getWorkingDaysInMonth(month: string): number {
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dayOfWeek = date.getDay();
      // Count Monday-Friday as working days (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
    }

    return workingDays;
  }
}

export const storage = new DatabaseStorage();
