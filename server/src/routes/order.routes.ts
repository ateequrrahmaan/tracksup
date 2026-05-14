import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";
import * as orderController from "../controllers/order.controller.js";

const router = Router();

router.use(verifyUser);
router.use(attachOrg);

router.get("/", orderController.getOrders);
router.post("/", orderController.createOrder);
router.patch("/:id/deliver", orderController.deliverOrder);
router.patch("/:id/assign", orderController.assignOrder);
router.patch("/:id/payment", orderController.updatePayment);

export default router;
