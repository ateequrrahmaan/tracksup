import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";
import * as empController from "../controllers/employee.controller.js";

const router = Router();

router.use(verifyUser);
router.use(attachOrg);

router.get("/:id", empController.getProfile);
router.get("/:id/orders", empController.getOrders);
router.get("/:id/performance", empController.getStats);
router.get("/:id/stats", empController.getStats); // Alias for retailers

export default router;
