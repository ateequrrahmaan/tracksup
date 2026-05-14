import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as empService from "../services/employee.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.orgId) return sendError(res, "Org ID missing", 400);

    const profile = await empService.getMemberProfile(id, req.orgId);
    if (!profile) return sendError(res, "Member not found in this organization", 404);
    
    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.orgId) return sendError(res, "Org ID missing", 400);

    const orders = await empService.getMemberOrders(id, req.orgId);
    sendSuccess(res, orders);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.orgId) return sendError(res, "Org ID missing", 400);

    const stats = await empService.getPerformanceStats(id, req.orgId);
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
