import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);
router.use(attachOrg);

router.get("/", (req, res) => res.json({ orders: [] }));
router.post("/", (req, res) => res.json({ message: "Order created" }));

export default router;
