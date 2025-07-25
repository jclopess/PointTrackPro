import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth"; // Importa a função hashPassword
import { storage } from "./storage";
import { insertTimeRecordSchema, insertJustificationSchema, insertDepartmentSchema, insertUserSchema, insertFunctionSchema, insertEmploymentTypeSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireManager = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "manager") {
      return res.status(403).json({ message: "Manager access required" });
    }
    next();
  };
  
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin routes for users
  app.get("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res, next) => {
    try {
      const { password, ...userData } = req.body;
      if (password) {
        userData.password = await hashPassword(password);
      }
      const updatedUser = await storage.updateUser(Number(req.params.id), userData);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });


  // Admin routes for departments
  app.get("/api/admin/departments", requireAdmin, async (req, res) => {
    const showInactive = req.query.inactive === 'true';
    res.json(await storage.getAllDepartments(showInactive));
  });

  app.post("/api/admin/departments", requireAdmin, async (req, res, next) => {
    try {
      const newDepartment = await storage.createDepartment(req.body);
      res.status(201).json(newDepartment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/departments/:id", requireAdmin, async (req, res, next) => {
    try {
      const updatedDepartment = await storage.updateDepartment(Number(req.params.id), req.body);
      res.json(updatedDepartment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/departments/:id/toggle", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    res.json(await storage.toggleDepartmentStatus(id, status));
  });


  // Admin routes for functions
  app.get("/api/admin/functions", requireAdmin, async (req, res) => {
    const showInactive = req.query.inactive === 'true';
    res.json(await storage.getAllFunctions(showInactive));
  });

  app.post("/api/admin/functions", requireAdmin, async (req, res, next) => {
    try {
      const newFunction = await storage.createFunction(req.body);
      res.status(201).json(newFunction);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/functions/:id", requireAdmin, async (req, res, next) => {
    try {
      const updatedFunction = await storage.updateFunction(Number(req.params.id), req.body);
      res.json(updatedFunction);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/functions/:id/toggle", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    res.json(await storage.toggleFunctionStatus(id, status));
  });

  // Admin routes for employment types
  app.get("/api/admin/employment-types", requireAdmin, async (req, res) => {
    const showInactive = req.query.inactive === 'true';
    res.json(await storage.getAllEmploymentTypes(showInactive));
  });

  app.post("/api/admin/employment-types", requireAdmin, async (req, res, next) => {
    try {
      const newType = await storage.createEmploymentType(req.body);
      res.status(201).json(newType);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/employment-types/:id", requireAdmin, async (req, res, next) => {
    try {
      const updatedType = await storage.updateEmploymentType(Number(req.params.id), req.body);
      res.json(updatedType);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/employment-types/:id/toggle", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    res.json(await storage.toggleEmploymentTypeStatus(id, status));
  });

  // Admin routes for password reset
  app.get("/api/admin/password-reset-requests", requireAdmin, async (req, res, next) => {
    try {
      const requests = await storage.getPendingPasswordResetRequests();
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/password-reset-requests/:id/resolve", requireAdmin, async (req, res, next) => {
    try {
        const requestId = Number(req.params.id);
        const adminId = req.user.id;

        const request = await storage.getPasswordResetRequest(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({ message: "Solicitação não encontrada ou já resolvida." });
        }

        const userToReset = await storage.getUserByCpf(request.cpf);
        if (!userToReset) {
            return res.status(404).json({ message: "Usuário associado à solicitação não encontrado." });
        }

        const tempPassword = userToReset.cpf.replace(/\D/g, '').substring(0, 6);
        const hashedPassword = await hashPassword(tempPassword);

        await storage.updateUser(userToReset.id, { password: hashedPassword });
        await storage.resolvePasswordResetRequest(requestId, adminId);

        res.json({ tempPassword });
    } catch (error) {
        next(error);
    }
  });

  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).send("Internal server error");
    }
  });

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
  app.post("/api/time-records", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      let timeRecord = await storage.getTimeRecord(userId, today);
      
      if (!timeRecord) {
        timeRecord = await storage.createTimeRecord({
          userId,
          date: today,
          entry1: new Date().toTimeString().slice(0, 5),
        });
      } else {
        const now = new Date().toTimeString().slice(0, 5);
        const lastTime = timeRecord.exit2 || timeRecord.entry2 || timeRecord.exit1 || timeRecord.entry1;
        
        if (lastTime) {
          const lastTimeMinutes = parseInt(lastTime.split(':')[0]) * 60 + parseInt(lastTime.split(':')[1]);
          const nowMinutes = parseInt(now.split(':')[0]) * 60 + parseInt(now.split(':')[1]);
          
          if (nowMinutes - lastTimeMinutes < 60) {
            return res.status(400).json({ 
              message: "É necessário aguardar pelo menos 1 hora entre os registros." 
            });
          }
        }
        
        if (!timeRecord.exit1) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { exit1: now });
        } else if (!timeRecord.entry2) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { entry2: now });
        } else if (!timeRecord.exit2) {
          timeRecord = await storage.updateTimeRecord(timeRecord.id, { exit2: now });
          
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

  // Rota de criação de usuário atualizada
  app.post("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
        const { password, ...userDataFromRequest } = req.body;

        const validatedData = insertUserSchema.omit({ password: true }).parse(userDataFromRequest);

        // Gera uma senha temporária (ex: os 6 primeiros dígitos do CPF)
        const tempPassword = validatedData.cpf.replace(/\D/g, '').substring(0, 6);
        const hashedPassword = await hashPassword(tempPassword);

        const newUser = await storage.createUser({
            ...validatedData,
            password: hashedPassword,
        });
        
        // Retorna o novo usuário e a senha temporária para o admin
        res.status(201).json({ user: newUser, tempPassword });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
        }
        // Trata erro de CPF duplicado do banco de dados
        if (error instanceof Error && 'code' in error && error.code === '23505') {
            return res.status(409).json({ message: "O CPF ou nome de usuário informado já está em uso." });
        }
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
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
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










  const httpServer = createServer(app);
  return httpServer;
}