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

  // ... (outras rotas permanecem iguais)
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).send("Internal server error");
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
        // Remove a senha do body para garantir que não seja usada
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

  // ... (o resto das suas rotas continua aqui)
  
  const httpServer = createServer(app);
  return httpServer;
}