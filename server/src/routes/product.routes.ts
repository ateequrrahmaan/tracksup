import { Router } from "express";
import { verifyUser, attachOrg } from "../middlewares/auth.middleware.js";
import * as productController from "../controllers/product.controller.js";

const router = Router();

router.use(verifyUser);
router.use(attachOrg);

router.get("/marketplace", productController.getMarketplace);
router.get("/", productController.getProducts);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;
