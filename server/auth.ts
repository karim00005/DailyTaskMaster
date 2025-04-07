import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { createHash, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";

// Define custom interface for Express.User that doesn't cause circular reference
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      fullName: string;
      password?: string;
      role: string;
      isActive: boolean;
    }
  }
}

// Helper to hash passwords
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Compare passwords
function comparePasswords(supplied: string, stored: string): boolean {
  const suppliedHash = hashPassword(supplied);
  return timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(stored));
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'busmansecret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "اسم المستخدم غير موجود" });
        }
        
        if (!comparePasswords(password, user.password)) {
          return done(null, false, { message: "كلمة المرور غير صحيحة" });
        }
        
        if (!user.isActive) {
          return done(null, false, { message: "الحساب معطل" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register routes
  app.post("/api/register", async (req, res) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "اسم المستخدم موجود بالفعل" });
      }
      
      // Create the user
      const user = await storage.createUser({
        ...req.body,
        // Password is hashed inside storage.createUser
      });
      
      // Log in the new user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "فشل تسجيل الدخول" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "فشل في إنشاء المستخدم" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "بيانات خاطئة" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "فشل في تسجيل الخروج" });
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json(req.user);
    }
    res.status(401).json({ message: "غير مصرح له" });
  });

  // Protected route middleware
  app.use([
    "/api/users",
    "/api/clients",
    "/api/products",
    "/api/warehouses",
    "/api/invoices",
    "/api/transactions",
    "/api/settings",
    "/api/dashboard"
  ], (req, res, next) => {
    // Skip auth check for GET on public resources
    if (req.method === "GET") {
      return next();
    }
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولا" });
    }
    
    // Check if user has admin role for sensitive operations
    const adminRoutes = ["/api/users", "/api/settings"];
    if (adminRoutes.some(route => req.path.startsWith(route)) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح لك بهذه العملية" });
    }
    
    next();
  });
}