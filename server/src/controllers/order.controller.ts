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
    if (!req.orgId) return sendError(res, "Org ID missing", 400);
    const { id } = req.params;
    const { paymentStatus, amountCollected, note } = req.body;

    const order = await orderService.deliverOrder(id, req.orgId, {
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

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const orgIdOrUserId = req.orgId || req.user.uid;
    const { id } = req.params;
    const { status } = req.body;
    const result = await orderService.updateOrderStatus(id, orgIdOrUserId, status, req.user.uid);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId } = req.body;
    console.log("[OrderController] Creating order:", { 
      orgId: req.orgId, 
      userId: req.user.uid, 
      supplierId 
    });
    
    if (!supplierId) return sendError(res, "Supplier ID missing", 400);

    const order = await orderService.createOrder(req.orgId || req.user.uid, supplierId, {
      ...req.body,
      userId: req.user.uid
    });
    sendSuccess(res, order, "Order created", 201);
  } catch (error: any) {
    console.error("CreateOrder Controller Error:", error);
    sendError(res, error.message);
  }
};

export const assignOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Org ID missing", 400);
    const { id } = req.params;
    const { employeeId, employeeName } = req.body;
    const result = await orderService.assignOrder(id, req.orgId, employeeId === "unassigned" ? null : employeeId, employeeName);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.orgId) return sendError(res, "Org ID missing", 400);
    const { id } = req.params;
    const { status } = req.body;
    const result = await orderService.updatePaymentStatus(id, req.orgId, status);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[OrderController] Attempting to delete order: ${id}, orgId: ${req.orgId}`);
    
    if (!req.orgId) {
      console.error("[OrderController] Org ID missing in request");
      return sendError(res, "Org ID missing", 400);
    }
    
    const result = await orderService.deleteOrder(id, req.orgId);
    console.log(`[OrderController] Successfully deleted order: ${id}`);
    sendSuccess(res, result, "Order deleted successfully");
  } catch (error: any) {
    console.error(`[OrderController] Error deleting order ${req.params.id}:`, error.message);
    sendError(res, error.message);
  }
};
