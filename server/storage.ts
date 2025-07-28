import { departments, users, timeRecords, justifications, hourBank, functions, employmentTypes, passwordResetRequests, type Department, type InsertDepartment, type User, type InsertUser, type TimeRecord, type InsertTimeRecord, type Justification, type InsertJustification, type HourBank, type InsertHourBank, type Function, type InsertFunction, type EmploymentType, type InsertEmploymentType, type PasswordResetRequest, type InsertPasswordResetRequest } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql, between } from "drizzle-orm"; 
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { start } from "repl";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  getAllDepartmentsForAdmin(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  
  // Function methods
  getAllFunctions(): Promise<Function[]>;
  getAllFunctionsForAdmin(): Promise<Function[]>;
  createFunction(func: InsertFunction): Promise<Function>;
  updateFunction(id: number, func: Partial<InsertFunction>): Promise<Function | undefined>;
  
  // Employment Type methods
  getAllEmploymentTypes(): Promise<EmploymentType[]>;
  getAllEmploymentTypesForAdmin(): Promise<EmploymentType[]>;
  createEmploymentType(type: InsertEmploymentType): Promise<EmploymentType>;
  updateEmploymentType(id: number, type: Partial<InsertEmploymentType>): Promise<EmploymentType | undefined>;
    
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllEmployees(departmentId: number): Promise<(User & { department: Department | null })[]>;
  getAllUsers(): Promise<(User & { department: Department | null; function: Function | null; employmentType: EmploymentType | null })[]>;

  // Time record methods
  getTimeRecord(userId: number, date: string): Promise<TimeRecord | undefined>;
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  updateTimeRecord(id: number, record: Partial<InsertTimeRecord>): Promise<TimeRecord | undefined>;
  getTimeRecordsForUser(userId: number, startDate: string, endDate: string): Promise<TimeRecord[]>;
  getAllTimeRecordsForDate(date: string, departmentId: number): Promise<(TimeRecord & { user: User })[]>;

  // Justification methods
  createJustification(justification: InsertJustification): Promise<Justification>;
  getJustificationsForUser(userId: number): Promise<Justification[]>;
  getPendingJustifications(): Promise<(Justification & { user: User })[]>;
  approveJustification(id: number, approverId: number, approved: boolean): Promise<Justification | undefined>;

  // Hour bank methods
  getHourBank(userId: number, month: string): Promise<HourBank | undefined>;
  createOrUpdateHourBank(hourBank: InsertHourBank): Promise<HourBank>;
  calculateHourBank(userId: number, month: string): Promise<HourBank>;

  // Password reset methods
  getPasswordResetRequest(id: number): Promise<PasswordResetRequest | undefined>;
  createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest>;
  getPendingPasswordResetRequests(): Promise<PasswordResetRequest[]>;
  resolvePasswordResetRequest(id: number, resolverId: number): Promise<PasswordResetRequest | undefined>;

  sessionStore: any;
}

export class DatabaseStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Department Methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async getAllDepartments(showInactive: boolean = false): Promise<Department[]> {
    if (showInactive) {
      return await db.select().from(departments);
    }
    return await db.select().from(departments).where(eq(departments.isActive, true));
  }

  async getAllDepartmentsForAdmin(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(data: InsertDepartment): Promise<Department> {
    const [newItem] = await db.insert(departments).values(data).returning();
    return newItem;
  }

  async updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updatedItem] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
    return updatedItem;
  }
  
  async toggleDepartmentStatus(id: number, status: boolean): Promise<Department | undefined> {
    const [item] = await db.update(departments).set({ isActive: status }).where(eq(departments.id, id)).returning();
    return item;
  }

  // Function methods
  async getAllFunctions(showInactive = false): Promise<Function[]> {
    if (showInactive) {
      return await db.select().from(functions);
    }
    return await db.select().from(functions).where(eq(functions.isActive, true));
  }

  async getAllFunctionsForAdmin(): Promise<Function[]> {
    return await db.select().from(functions);
  }

  async createFunction(data: InsertFunction): Promise<Function> {
    const [newItem] = await db.insert(functions).values(data).returning();
    return newItem;
  }

  async updateFunction(id: number, data: Partial<InsertFunction>): Promise<Function | undefined> {
    const [updatedItem] = await db.update(functions).set(data).where(eq(functions.id, id)).returning();
    return updatedItem;
  }

  async toggleFunctionStatus(id: number, status: boolean): Promise<Function | undefined> {
    const [item] = await db.update(functions).set({ isActive: status }).where(eq(functions.id, id)).returning();
    return item;
  }
  // Employment type methods
  async getAllEmploymentTypes(showInactive = false): Promise<EmploymentType[]> {
    if (showInactive) {
      return await db.select().from(employmentTypes);
    }
    return await db.select().from(employmentTypes).where(eq(employmentTypes.isActive, true));
  }
  
  async getAllEmploymentTypesForAdmin(): Promise<EmploymentType[]> {
    return await db.select().from(employmentTypes);
  }

  async createEmploymentType(data: InsertEmploymentType): Promise<EmploymentType> {
    const [newItem] = await db.insert(employmentTypes).values(data).returning();
    return newItem;
  }

  async updateEmploymentType(id: number, data: Partial<InsertEmploymentType>): Promise<EmploymentType | undefined> {
    const [updatedItem] = await db.update(employmentTypes).set(data).where(eq(employmentTypes.id, id)).returning();
    return updatedItem;
  }

  async toggleEmploymentTypeStatus(id: number, status: boolean): Promise<EmploymentType | undefined> {
    const [item] = await db.update(employmentTypes).set({ isActive: status }).where(eq(employmentTypes.id, id)).returning();
    return item;
  }
  
  // User methods
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

  async getAllEmployees(departmentId: number): Promise<(User & { department: Department | null })[]> {
    return await db
      .select()
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(
        eq(users.status, "active"), 
        eq(users.role, "employee"),
        eq(users.departmentId, departmentId) // Filtro por departamento adicionado
      ))
      .then(results => results.map(result => ({
        ...result.users,
        department: result.departments
      })));
  }

  async getAllUsers(): Promise<(User & { department: Department | null; function: Function | null; employmentType: EmploymentType | null })[]> {
    const results = await db
      .select()
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(functions, eq(users.functionId, functions.id))
      .leftJoin(employmentTypes, eq(users.employmentTypeId, employmentTypes.id));
    
    return results.map(result => ({
      ...result.users,
      department: result.departments,
      function: result.functions,
      employmentType: result.employment_types
    }));
  }

  // Time record methods
  async getTimeRecordById(id: number): Promise<TimeRecord | undefined> {
    const [record] = await db
      .select()
      .from(timeRecords)
      .where(eq(timeRecords.id, id));
    return record;
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

  async getTimeRecordsForUser(userId: number, startDate: string, endDate: string): Promise<TimeRecord[]> {
    return await db
      .select()
      .from(timeRecords)
      .where(and(
        eq(timeRecords.userId, userId),
        between(timeRecords.date, startDate, endDate)
      ))
      .orderBy(asc(timeRecords.date));
  }
  async getAllTimeRecordsForDate(date: string, departmentId: number): Promise<(TimeRecord & { user: User })[]> {
    return await db
      .select()
      .from(timeRecords)
      .innerJoin(users, eq(timeRecords.userId, users.id))
      .where(and(
        eq(timeRecords.date, date),
        eq(users.departmentId, departmentId) // Filtro por departamento adicionado
      ))
      .then(results => results.map(result => ({
        ...result.time_records,
        user: result.users
      })));
  }

  // Justifications Methods
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

  async getJustificationsForUserByDateRange(userId: number, startDate: string, endDate: string): Promise<Justification[]> {
    return await db
      .select()
      .from(justifications)
      .where(and(
        eq(justifications.userId, userId),
        between(justifications.date, startDate, endDate)
      ));
  }

  async getPendingJustifications(departmentId?: number): Promise<(Justification & { user: User })[]> {
    const conditions = [eq(justifications.status, "pending")];

    if (departmentId) {
      conditions.push(eq(users.departmentId, departmentId));
    }
    const results = await db
      .select()
      .from(justifications)
      .innerJoin(users, eq(justifications.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(justifications.createdAt))

    return results.map(result => ({
      ...result.justifications,
      user: result.users
    }));
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
    const records = await this.getTimeRecordsForUser(userId, `${month}-01`, `${month}-31`);
    
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
  
  async getFunction(id: number): Promise<Function | undefined> {
    const [func] = await db.select().from(functions).where(eq(functions.id, id));
    return func || undefined;
  }

  async getEmploymentType(id: number): Promise<EmploymentType | undefined> {
    const [type] = await db.select().from(employmentTypes).where(eq(employmentTypes.id, id));
    return type || undefined;
  }

  // Password reset methods
  async getPasswordResetRequest(id: number): Promise<PasswordResetRequest | undefined> {
    const [request] = await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.id, id));
    return request;
  }

  async createPasswordResetRequest(insertRequest: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [request] = await db
      .insert(passwordResetRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getPendingPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.status, "pending"));
  }

  async resolvePasswordResetRequest(id: number, resolverId: number): Promise<PasswordResetRequest | undefined> {
    const [request] = await db
      .update(passwordResetRequests)
      .set({ 
        status: "resolved",
        resolvedBy: resolverId,
        resolvedAt: new Date()
      })
      .where(eq(passwordResetRequests.id, id))
      .returning();
    return request || undefined;
  }
}

export const storage = new DatabaseStorage();