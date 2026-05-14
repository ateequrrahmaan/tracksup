import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { config } from "dotenv";
import { fileURLToPath } from "url";

// Resolving __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root or local
config({ path: path.join(__dirname, "../.env") });

// API Routes
import authRoutes from "./src/routes/auth.routes.js";
import organizationRoutes from "./src/routes/organization.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";
import productRoutes from "./src/routes/product.routes.js";

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = Number(process.env.PORT) || 3000;

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production",
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-organization-id"]
  }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json());
  
  if (process.env.NODE_ENV === "production") {
    app.use("/api", limiter);
  }

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/products", productRoutes);

  // Health Check
  app.get("/api/health", (req: express.Request, res: express.Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Centralized Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || "Internal Server Error",
        code: err.code || "INTERNAL_ERROR"
      }
    });
  });

  // Vite Integration (only if running from root with access to client)
  const clientRoot = path.join(__dirname, "../client");
  const viteConfig = path.join(__dirname, "../vite.config.ts");
  
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: clientRoot,
        configFile: viteConfig,
      });
      app.use(vite.middlewares);
      console.log(">>> Vite middleware attached for development");
    } catch (e) {
      console.warn(">>> Vite middleware failed to attach (expected if running standalone server)");
    }
  } else {
    // Production: serve static files from the client's dist directory
    const distPath = path.join(__dirname, "../../dist/client");
    if (fs.existsSync(path.join(distPath, "index.html"))) {
      app.use(express.static(distPath));
      app.get("*", (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log(`>>> Production: Serving client from ${distPath}`);
    } else {
      console.log(">>> Production: Client dist not found at", distPath);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Production-Ready Terminal running on http://0.0.0.0:${PORT}`);
    console.log(`>>> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
