import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as orgService from "../services/organization.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const orgs = await orgService.listOrganizationsForUser(userId);
    sendSuccess(res, orgs);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const org = await orgService.createOrganization({
      ...req.body,
      ownerId: req.user.uid
    });
    sendSuccess(res, org, "Organization created", 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

export const getOrganizationById = async (req: AuthRequest, res: Response) => {
  try {
    const org = await orgService.getOrganizationById(req.params.id, req.user.uid);
    if (!org) return sendError(res, "Organization not found or access denied", 404);
    sendSuccess(res, org);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const joinOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, "Token required", 400);

    const result = await orgService.joinByInvite(token, req.user.uid, req.user.email);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Org ID missing", 400);
    
    // We need org name for the invite data
    const org = await orgService.getOrganizationById(req.orgId, req.user.uid);
    if (!org) return sendError(res, "Organization not found", 404);

    const result = await orgService.createInvite(req.orgId, (org as any).name, req.user.uid, req.body);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const result = await orgService.deleteInvite(token);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const org = await orgService.updateOrganization(id, req.user.uid, req.body);
    sendSuccess(res, org);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};
