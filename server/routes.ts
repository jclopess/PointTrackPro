import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTimeRecordSchema, insertJustificationSchema, insertDepartmentSchema, insertUserSchema, insertFunctionSchema, insertEmploymentTypeSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Helper to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Helper to check if user is manager
  const requireManager = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "manager") {
      return res.status(403).json({ message: "Manager access required" });
    }
    next();
  };
  
  // Helper to check if user is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Departments endpoint
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Time registration endpoint
  app.post("/api/time-records", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing record for today
      let timeRecord = await storage.getTimeRecord(userId, today);
      
      if (!timeRecord) {
        // Create new record with entry1
        timeRecord = await storage.createTimeRecord({
          userId,
          date: today,
          entry1: new Date().toTimeString().slice(0, 5),
        });
      } else {
        // Update next available slot
        const now = new Date().toTimeString().slice(0, 5);
        const lastTime = timeRecord.exit2 || timeRecord.entry2 || timeRecord.exit1 || timeRecord.entry1;
        
        // Validate 1-hour interval
        if (lastTime) {
          const lastTimeMinutes = parseInt(lastTime.split(':')[0]) * 60 + parseInt(lastTime.split(':')[1]);
          const nowMinutes = parseInt(now.split(':')[0]) * 60 + parseInt(now.split(':')[1]);
          
          if (nowMinutes - lastTimeMinutes < 60) {
            return res.status(400).json({ 
              message: "Minimum 1-hour interval required between registrations" 
            });
          }
        }
        
        // Determine next slot
        if (!timeRecord.exit1) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { exit1: now });
        } else if (!timeRecord.entry2) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { entry2: now });
        } else if (!timeRecord.exit2) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { exit2: now });
          
          // Calculate total hours
          const entry1Minutes = parseInt(timeRecord.entry1!.split(':')[0]) * 60 + parseInt(timeRecord.entry1!.split(':')[1]);
          const exit1Minutes = parseInt(timeRecord.exit1!.split(':')[0]) * 60 + parseInt(timeRecord.exit1!.split(':')[1]);
          const entry2Minutes = parseInt(timeRecord.entry2!.split(':')[0]) * 60 + parseInt(timeRecord.entry2!.split(':')[1]);
          const exit2Minutes = parseInt(now.split(':')[0]) * 60 + parseInt(now.split(':')[1]);
          
          const totalMinutes = (exit1Minutes - entry1Minutes) + (exit2Minutes - entry2Minutes);
          const totalHours = totalMinutes / 60;
          
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { 
            totalHours: totalHours.toFixed(2) 
          });
        } else {
          return res.status(400).json({ message: "All time slots for today are already filled" });
        }
      }
      
      res.json(timeRecord);
    } catch (error) {
      next(error);
    }
  });

  // Get time records for user
  app.get("/api/time-records", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const month = req.query.month as string;
      const records = await storage.getTimeRecordsForUser(userId, month);
      res.json(records);
    } catch (error) {
      next(error);
    }
  });

  // Get today's time record
  app.get("/api/time-records/today", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const record = await storage.getTimeRecord(userId, today);
      res.json(record || null);
    } catch (error) {
      next(error);
    }
  });

  // Submit justification
  app.post("/api/justifications", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertJustificationSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const justification = await storage.createJustification(validatedData);
      res.status(201).json(justification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  // Get justifications for user
  app.get("/api/justifications", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const justifications = await storage.getJustificationsForUser(userId);
      res.json(justifications);
    } catch (error) {
      next(error);
    }
  });

  // Manager endpoints
  app.get("/api/manager/employees", requireManager, async (req, res, next) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager/time-records/:date", requireManager, async (req, res, next) => {
    try {
      const date = req.params.date;
      const records = await storage.getAllTimeRecordsForDate(date);
      res.json(records);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager/justifications/pending", requireManager, async (req, res, next) => {
    try {
      const justifications = await storage.getPendingJustifications();
      res.json(justifications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/manager/justifications/:id/approve", requireManager, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { approved } = req.body;
      const justification = await storage.approveJustification(id, req.user.id, approved);
      
      if (!justification) {
        return res.status(404).json({ message: "Justification not found" });
      }
      
      res.json(justification);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/manager/time-records/:id", requireManager, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Recalculate total hours if times are updated
      if (updateData.entry1 || updateData.exit1 || updateData.entry2 || updateData.exit2) {
        const record = await storage.updateTimeRecord(id, updateData);
        if (record && record.entry1 && record.exit1 && record.entry2 && record.exit2) {
          const entry1Minutes = parseInt(record.entry1.split(':')[0]) * 60 + parseInt(record.entry1.split(':')[1]);
          const exit1Minutes = parseInt(record.exit1.split(':')[0]) * 60 + parseInt(record.exit1.split(':')[1]);
          const entry2Minutes = parseInt(record.entry2.split(':')[0]) * 60 + parseInt(record.entry2.split(':')[1]);
          const exit2Minutes = parseInt(record.exit2.split(':')[0]) * 60 + parseInt(record.exit2.split(':')[1]);
          
          const totalMinutes = (exit1Minutes - entry1Minutes) + (exit2Minutes - entry2Minutes);
          const totalHours = totalMinutes / 60;
          
          await storage.updateTimeRecord(id, { totalHours: totalHours.toFixed(2) });
        }
      }
      
      const timeRecord = await storage.updateTimeRecord(id, updateData);
      if (!timeRecord) {
        return res.status(404).json({ message: "Time record not found" });
      }
      
      res.json(timeRecord);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/manager/hour-bank/:userId/:month", requireManager, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const month = req.params.month;
      const hourBank = await storage.calculateHourBank(userId, month);
      res.json(hourBank);
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/functions", requireAdmin, async (req, res) => {
    try {
      const functions = await storage.getAllFunctions();
      res.json(functions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/employment-types", requireAdmin, async (req, res) => {
    try {
      const types = await storage.getAllEmploymentTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/password-reset-requests", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingPasswordResetRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Department Routes
  app.post("/api/admin/departments", requireAdmin, async (req, res, next) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/admin/departments/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, validatedData);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/admin/departments/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDepartment(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Function Routes
  app.post("/api/admin/functions", requireAdmin, async (req, res, next) => {
    try {
      const functionData = insertFunctionSchema.parse(req.body);
      const func = await storage.createFunction(functionData);
      res.status(201).json(func);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/admin/functions/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const functionData = insertFunctionSchema.partial().parse(req.body);
      const func = await storage.updateFunction(id, functionData);
      if (!func) {
        return res.status(404).json({ message: "Function not found" });
      }
      res.json(func);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.delete("/api/admin/functions/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFunction(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Employment Type Routes
  app.post("/api/admin/employment-types", requireAdmin, async (req, res, next) => {
    try {
      const typeData = insertEmploymentTypeSchema.parse(req.body);
      const type = await storage.createEmploymentType(typeData);
      res.status(201).json(type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/admin/employment-types/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const typeData = insertEmploymentTypeSchema.partial().parse(req.body);
      const type = await storage.updateEmploymentType(id, typeData);
      if (!type) {
        return res.status(404).json({ message: "Employment type not found" });
      }
      res.json(type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/admin/employment-types/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmploymentType(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}