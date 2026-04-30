import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as orgService from "../services/organization.service.js";

export const getOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.uid;
    const orgs = await orgService.listOrganizationsForUser(userId);
    res.json({ organizations: orgs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const org = await orgService.createOrganization({
      ...req.body,
      ownerId: req.user.uid
    });
    res.status(201).json(org);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrganizationById = async (req: AuthRequest, res: Response) => {
  try {
    const org = await orgService.getOrganizationById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
