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

export const deliverOrder = async (orderId: string, deliveryData: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error("Order not found");
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

  return { id: orderId, ...orderDoc.data(), status: "delivered" };
};

export const createOrder = async (orgId: string, supplierId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderData = {
    ...data,
    organizationId: orgId,
    supplierId,
    status: data.employeeId ? "assigned" : "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await firestore.collection("orders").add(orderData);
  return { id: docRef.id, ...orderData };
};

export const assignOrder = async (orderId: string, employeeId: string | null, employeeName?: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  await firestore.collection("orders").doc(orderId).update({
    employeeId,
    employeeName: employeeId ? (employeeName || "") : "",
    status: employeeId ? "assigned" : "pending",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: orderId, employeeId, employeeName };
};

export const updatePaymentStatus = async (orderId: string, status: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  await firestore.collection("orders").doc(orderId).update({
    payment_status: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: orderId, status };
};
