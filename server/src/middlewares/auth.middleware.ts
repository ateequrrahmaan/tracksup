import { Request, Response, NextFunction } from "express";
import { auth as getAdminAuth, db } from "../services/firebase.service.js";
import { sendError } from "../utils/response.js";

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
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      // Fallback for development if keys are missing - only if NODE_ENV !== production
      if (process.env.NODE_ENV !== "production") {
        console.warn("Firebase Admin not initialized. Using fallback user for development.");
        req.user = { uid: "test-user", email: "user@example.com" };
        return next();
      }
      throw new Error("Auth service unavailable");
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("Auth Error:", error);
    res.status(401).json({ 
      message: "Invalid or expired token",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined
    });
  }
};

export const attachOrg = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const orgId = req.headers["x-organization-id"] as string;
  
  if (!orgId) {
    return next();
  }

  try {
    const firestore = db();
    if (!firestore) return next();

    // Verify membership
    const membership = await firestore.collection("memberships")
      .where("organizationId", "==", orgId)
      .where("userId", "==", req.user.uid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (membership.empty) {
      return sendError(res, "Access denied to this organization", 403, "ORG_ACCESS_DENIED");
    }

    req.orgId = orgId;
    next();
  } catch (error: any) {
    console.error("AttachOrg Error:", error);
    sendError(res, error.message || "Internal server error during org attaching");
  }
};
