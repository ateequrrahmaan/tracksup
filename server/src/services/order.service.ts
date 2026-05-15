import admin from "firebase-admin";
import { db } from "./firebase.service.js";

export const getOrdersByOrg = async (orgId: string, userId?: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // Fetch orders where this org is the retailer OR this specific user is the retailer
  const retailerIds = Array.from(new Set([orgId, userId].filter(Boolean)));

  const retailerOrders = await firestore.collection("orders")
    .where("retailerId", "in", retailerIds)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  // Fetch orders where this org is the supplier
  const supplierOrders = await firestore.collection("orders")
    .where("supplierId", "==", orgId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  // Combined fetch (avoiding duplicates)
  const ordersMap = new Map();
  retailerOrders.docs.forEach(doc => ordersMap.set(doc.id, { id: doc.id, ...doc.data() }));
  supplierOrders.docs.forEach(doc => ordersMap.set(doc.id, { id: doc.id, ...doc.data() }));
  
  const allOrders = Array.from(ordersMap.values());

  return allOrders.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
    const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
    return timeB - timeA;
  });
};

export const deliverOrder = async (orderId: string, orgId: string, deliveryData: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error("Order not found");
  }

  const orderData = orderDoc.data()!;
  // Check if current org is the supplier or retailer
  if (orderData.supplierId !== orgId && orderData.retailerId !== orgId) {
    throw new Error("Unauthorized to access this order");
  }

  await orderRef.update({
    status: "delivered",
    payment_status: deliveryData.paymentStatus,
    amount_collected: deliveryData.amountCollected,
    delivered_at: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    deliveredBy: deliveryData.userId,
    note: deliveryData.note || ""
  });

  return { id: orderId, ...orderData, status: "delivered" };
};

export const createOrder = async (orgId: string, supplierId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // 1. Verify retailer membership (orgId passed from middleware is the retailer org)
  // 2. Verify connection to supplier
  const membership = await firestore.collection("memberships")
    .where("userId", "==", data.userId || orgId) // userId is passed from controller
    .where("organizationId", "==", supplierId)
    .where("role", "==", "retailer")
    .where("status", "==", "active")
    .get();

  if (membership.empty) {
    throw new Error("You are not connected to this supplier. Please accept an invite first.");
  }

  // 3. Fetch trusted names
  const [retailerDoc, supplierDoc] = await Promise.all([
    firestore.collection("organizations").doc(orgId).get(),
    firestore.collection("organizations").doc(supplierId).get()
  ]);

  if (!retailerDoc.exists) throw new Error("Retailer organization not found");
  if (!supplierDoc.exists) throw new Error("Supplier organization not found");

  const orderData = {
    ...data,
    organizationId: orgId, // Retailer's primary org
    retailerId: orgId,
    retailerName: retailerDoc.data()?.name || "Unknown Retailer",
    supplierId,
    supplierName: supplierDoc.data()?.name || "Unknown Supplier",
    status: data.employeeId ? "assigned" : "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Remove userId from data to avoid double storage if it's in req.body
  delete orderData.userId;

  const docRef = await firestore.collection("orders").add(orderData);
  return { id: docRef.id, ...orderData };
};

export const assignOrder = async (orderId: string, orgId: string, employeeId: string | null, employeeName?: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) throw new Error("Order not found");
  if (orderDoc.data()?.supplierId !== orgId) throw new Error("Only suppliers can assign orders");

  await orderRef.update({
    employeeId,
    employeeName: employeeId ? (employeeName || "") : "",
    status: employeeId ? "assigned" : "pending",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: orderId, employeeId, employeeName };
};

export const updatePaymentStatus = async (orderId: string, orgId: string, status: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) throw new Error("Order not found");
  if (orderDoc.data()?.supplierId !== orgId && orderDoc.data()?.retailerId !== orgId) {
    throw new Error("Unauthorized to update payment status");
  }

  await orderRef.update({
    payment_status: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: orderId, status };
};
