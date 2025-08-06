import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Lógica condicional com importação dinâmica
  if (process.env.NODE_ENV === "development") {
    log("Running in development mode, setting up Vite...");
    // Importa o setupVite dinamicamente apenas em desenvolvimento
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    log("Running in production mode, serving static files...");
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Server listening on port ${port}`);
  });
})();
