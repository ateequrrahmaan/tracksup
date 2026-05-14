import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";
import * as orgController from "../controllers/organization.controller.js";

const router = Router();

router.use(verifyUser);

router.get("/", orgController.getOrganizations);
router.post("/", orgController.createOrganization);
router.post("/join", orgController.joinOrganization);

// Protected routes requiring organization context
router.post("/invite", attachOrg, orgController.createInvite);
router.delete("/invites/:token", attachOrg, orgController.deleteInvite);
router.get("/:id", orgController.getOrganizationById);
router.patch("/:id", attachOrg, orgController.updateOrganization);

export default router;
