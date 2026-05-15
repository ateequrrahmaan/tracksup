import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as orderService from "../services/order.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) {
      return sendError(res, "Organization ID is required", 400);
    }
    const orders = await orderService.getOrdersByOrg(req.orgId, req.user.uid);
    sendSuccess(res, orders);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deliverOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus, amountCollected, note } = req.body;

    const order = await orderService.deliverOrder(id, {
      paymentStatus,
      amountCollected,
      note,
      userId: req.user.uid
    });

    sendSuccess(res, order);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Org ID missing", 400);
    const { supplierId, retailerId } = req.body;
    
    if (!supplierId) return sendError(res, "Supplier ID missing", 400);

    const finalRetailerId = retailerId || req.user.uid;

    const order = await orderService.createOrder(req.orgId, supplierId, {
      ...req.body,
      retailerId: finalRetailerId
    });
    sendSuccess(res, order, "Order created", 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const assignOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeId, employeeName } = req.body;
    const result = await orderService.assignOrder(id, employeeId === "unassigned" ? null : employeeId, employeeName);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await orderService.updatePaymentStatus(id, status);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
