import express, { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", verifyUser, authController.getMe);
router.patch("/me", verifyUser, authController.updateMe);
router.get("/resolve/:id", verifyUser, authController.resolveName);
router.post("/login", (req: express.Request, res: express.Response) => res.json({ message: "Login success" }));
router.post("/register", (req: express.Request, res: express.Response) => res.json({ message: "Registration success" }));

export default router;
