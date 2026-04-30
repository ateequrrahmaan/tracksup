import { Router } from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);

router.get("/", (req, res) => res.json({ organizations: [] }));
router.post("/", (req, res) => res.json({ message: "Organization created" }));

export default router;
