import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as productService from "../services/product.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Organization ID required", 400);
    const products = await productService.listProducts(req.orgId);
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Organization ID required", 400);
    // Basic validation
    const { name, price } = req.body;
    if (!name || !price) return sendError(res, "Name and price are required", 400);

    const product = await productService.createProduct(req.orgId, req.body);
    sendSuccess(res, product, "Product created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Organization ID required", 400);
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.orgId, req.body);
    sendSuccess(res, product, "Product updated successfully");
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Organization ID required", 400);
    const { id } = req.params;
    await productService.deleteProduct(id, req.orgId);
    sendSuccess(res, null, "Product deleted successfully");
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getMarketplace = async (req: AuthRequest, res: Response) => {
  try {
    const products = await productService.listMarketplaceProducts(req.user.uid);
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
