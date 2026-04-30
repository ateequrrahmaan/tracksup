import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);
router.use(attachOrg);

router.get("/", (req, res) => res.json({ employees: [] }));

export default router;
