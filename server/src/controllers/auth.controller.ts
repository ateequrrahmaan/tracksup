import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const context = await authService.getUserContext(req.user.uid);
    sendSuccess(res, context);
  } catch (error: any) {
    console.error("getUserContext error:", error);
    sendError(res, error.message);
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await authService.updateUser(req.user.uid, req.body);
    sendSuccess(res, updated);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const resolveName = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const firestore = (await import("../services/firebase.service.js")).db();
    if (!firestore) throw new Error("Firestore not initialized");

    // 1. Try organization
    const orgDoc = await firestore.collection("organizations").doc(id).get();
    if (orgDoc.exists) {
      return sendSuccess(res, { id: orgDoc.id, name: orgDoc.data()?.name, type: "organization" });
    }

    // 2. Try user
    const userDoc = await firestore.collection("users").doc(id).get();
    if (userDoc.exists) {
      return sendSuccess(res, { id: userDoc.id, name: userDoc.data()?.name, type: "user" });
    }

    sendError(res, "Identity not found", 404);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
