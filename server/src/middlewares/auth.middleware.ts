import { Request, Response, NextFunction } from "express";
// import admin from "../services/firebase.service.js"; // This will be created next

export interface AuthRequest extends Request {
  user?: any;
  orgId?: string;
}

export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // In a real production app with Firebase:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = decodedToken;
    
    // For now, we simulate success for pathing
    req.user = { uid: "test-user", email: "user@example.com" };
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const attachOrg = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Extract orgId from headers or token
  const orgId = req.headers["x-organization-id"] as string;
  
  if (orgId) {
    req.orgId = orgId;
  }
  
  next();
};
