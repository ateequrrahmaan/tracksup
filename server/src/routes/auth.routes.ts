import { Router } from "express";
// import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", (req, res) => res.json({ message: "Login logic here" }));
router.post("/register", (req, res) => res.json({ message: "Register logic here" }));

export default router;
