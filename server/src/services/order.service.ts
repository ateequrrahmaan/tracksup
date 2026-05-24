import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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

// Helper to deduct stock when order is delivered
const deductInventoryStock = async (firestore: admin.firestore.Firestore, orderData: any) => {
  const supplierId = orderData.supplierId;
  if (!supplierId) return;

  const productsSnapshot = await firestore.collection("products")
    .where("supplierId", "==", supplierId)
    .get();

  const productsInDb = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  const batch = firestore.batch();
  let updatedCount = 0;

  for (const item of orderData.items || []) {
    const matchedProduct = productsInDb.find(p => p.name?.toLowerCase() === item.name?.toLowerCase());
    if (matchedProduct) {
      const currentStock = typeof matchedProduct.stock === "number" ? matchedProduct.stock : 0;
      const pRef = firestore.collection("products").doc(matchedProduct.id);
      // Deduct stock, ensuring it doesn't go below 0
      const newStock = Math.max(0, currentStock - item.quantity);
      batch.update(pRef, {
        stock: newStock,
        updatedAt: FieldValue.serverTimestamp()
      });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`[OrderService] Deducted inventory stock for ${updatedCount} products upon delivery of order ${orderData.id || ""}`);
  }
};

// Helper to restore stock when order transitions from delivered to cancelled/deleted/etc.
const restoreInventoryStock = async (firestore: admin.firestore.Firestore, orderData: any) => {
  const supplierId = orderData.supplierId;
  if (!supplierId) return;

  const productsSnapshot = await firestore.collection("products")
    .where("supplierId", "==", supplierId)
    .get();

  const productsInDb = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  const batch = firestore.batch();
  let restoredCount = 0;

  for (const item of orderData.items || []) {
    const matchedProduct = productsInDb.find(p => p.name?.toLowerCase() === item.name?.toLowerCase());
    if (matchedProduct) {
      const currentStock = typeof matchedProduct.stock === "number" ? matchedProduct.stock : 0;
      const pRef = firestore.collection("products").doc(matchedProduct.id);
      batch.update(pRef, {
        stock: currentStock + item.quantity,
        updatedAt: FieldValue.serverTimestamp()
      });
      restoredCount++;
    }
  }

  if (restoredCount > 0) {
    await batch.commit();
    console.log(`[OrderService] Restored stock of ${restoredCount} products due to delivery cancel/reversion of order ${orderData.id || ""}`);
  }
};

export const deliverOrder = async (orderId: string, orgId: string, deliveryData: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error(`Order ${orderId} not found`);
  }

  const orderData = orderDoc.data()!;
  // Authorization: supplier, retailer, or the assigned employee
  const isSupplier = orderData.supplierId === orgId;
  const isRetailer = orderData.retailerId === orgId;
  const isAssignedEmployee = orderData.employeeId === deliveryData.userId;

  if (!isSupplier && !isRetailer && !isAssignedEmployee) {
    console.error(`Unauthorized delivery attempt: order=${orderId}, org=${orgId}, user=${deliveryData.userId}`);
    throw new Error("Unauthorized to complete this delivery");
  }

  const prevStatus = orderData.status;

  await orderRef.update({
    status: "delivered",
    payment_status: deliveryData.paymentStatus,
    amount_collected: deliveryData.amountCollected,
    delivered_at: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deliveredBy: deliveryData.userId,
    note: deliveryData.note || ""
  });

  if (prevStatus !== "delivered") {
    await deductInventoryStock(firestore, { id: orderId, ...orderData });
  }

  return { id: orderId, ...orderData, status: "delivered" };
};

export const updateOrderStatus = async (orderId: string, orgId: string, status: string, userId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) throw new Error(`Order ${orderId} not found`);
  const orderData = orderDoc.data()!;
  
  // Authorization: supplier, retailer, or the assigned employee
  const isSupplier = orderData.supplierId === orgId;
  const isRetailer = orderData.retailerId === orgId;
  const isAssignedEmployee = orderData.employeeId === userId;

  if (!isSupplier && !isRetailer && !isAssignedEmployee) {
    console.error(`Unauthorized status update: order=${orderId}, org=${orgId}, user=${userId}, targetStatus=${status}`);
    throw new Error("Unauthorized to update this order status");
  }

  const prevStatus = orderData.status;

  // Perform stock adjustments based on status transitions
  if (status === "delivered" && prevStatus !== "delivered") {
    await deductInventoryStock(firestore, { id: orderId, ...orderData });
  } else if (prevStatus === "delivered" && status !== "delivered") {
    // If it was delivered and now is either cancelled, reverted, assigned, or pending:
    await restoreInventoryStock(firestore, { id: orderId, ...orderData });
  }

  await orderRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp()
  });

  return { id: orderId, status };
};

export const createOrder = async (orgId: string, supplierId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const { retailerId, userId } = data;
  console.log("[OrderService] createOrder request:", { orgId, supplierId, retailerId, userId });
  
  if (!retailerId) {
    console.error("[OrderService] Missing retailerId");
    throw new Error("Retailer ID is required");
  }

  // 2. Authorization
  console.log(`[OrderService] Auth check: user=${userId}, retailer=${retailerId}, supplier=${supplierId}, orgContext=${orgId}`);

  // We allow order creation if:
  // 1. The user is the retailer (personal order)
  // 2. The user is a member of the retailer organization
  // 3. The user is a member of the supplier organization (creating on behalf of a retailer)
  
  let isAuthorized = (retailerId === userId);

  if (!isAuthorized) {
    // Check memberships in parallel
    const [retailerMembership, supplierMembership] = await Promise.all([
      firestore.collection("memberships")
        .where("userId", "==", userId)
        .where("organizationId", "==", retailerId)
        .where("status", "==", "active")
        .get(),
      firestore.collection("memberships")
        .where("userId", "==", userId)
        .where("organizationId", "==", supplierId)
        .where("status", "==", "active")
        .get()
    ]);

    if (!retailerMembership.empty) {
      console.log(`[OrderService] Authorized via Retailer Org membership. Role: ${retailerMembership.docs[0].data().role}`);
      isAuthorized = true;
    } else if (!supplierMembership.empty) {
      console.log(`[OrderService] Authorized via Supplier Org membership. Role: ${supplierMembership.docs[0].data().role}`);
      isAuthorized = true;
    } else {
      console.log(`[OrderService] No active memberships found for user ${userId} in retailer ${retailerId} or supplier ${supplierId}`);
    }
  } else {
    console.log("[OrderService] Authorized: Personal retailer order");
  }

  if (!isAuthorized) {
    console.error("[OrderService] Authorization failed for order creation");
    throw new Error("Unauthorized: You do not have permission to place orders for this retailer or supplier.");
  }

  // 3. Fetch trusted names
  console.log("[OrderService] Resolving names...");
  const [retailerUserDoc, retailerOrgDoc, supplierDoc] = await Promise.all([
    firestore.collection("users").doc(retailerId).get(),
    firestore.collection("organizations").doc(retailerId).get(),
    firestore.collection("organizations").doc(supplierId).get()
  ]);

  if (!supplierDoc.exists) {
    console.error("[OrderService] Supplier Org not found:", supplierId);
    throw new Error("Supplier organization not found");
  }

  const retailerName = retailerOrgDoc.exists 
    ? (retailerOrgDoc.data()?.name || "Unknown Retailer")
    : (retailerUserDoc.exists ? (retailerUserDoc.data()?.name || "Unknown Retailer") : "Unknown Retailer");

  console.log("[OrderService] Resolved retailerName:", retailerName, "supplierName:", supplierDoc.data()?.name);

  const orderData = {
    ...data,
    retailerId,
    retailerName,
    supplierId,
    supplierName: supplierDoc.data()?.name || "Unknown Supplier",
    status: data.employeeId ? "assigned" : "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Remove userId from data to avoid double storage
  delete orderData.userId;

  console.log("[OrderService] Attempting to save order to Firestore...");
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
    updatedAt: FieldValue.serverTimestamp()
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
    updatedAt: FieldValue.serverTimestamp()
  });

  return { id: orderId, status };
};

export const deleteOrder = async (orderId: string, orgId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  console.log(`[OrderService] deleteOrder: id=${orderId}, orgId=${orgId}`);

  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    console.error(`[OrderService] Order ${orderId} not found`);
    throw new Error("Order not found");
  }
  
  const orderData = orderDoc.data()!;
  console.log(`[OrderService] Found order. SupplierId in DB: ${orderData.supplierId}, Caller OrgId: ${orgId}`);

  // Only the supplier of this order can delete it
  if (orderData.supplierId !== orgId) {
    console.error(`[OrderService] Unauthorized delete: order supplier=${orderData.supplierId}, caller=${orgId}`);
    throw new Error("Unauthorized: Only the supplier can delete this order");
  }

  // Restore inventory if we are deleting an already delivered order
  if (orderData.status === "delivered") {
    await restoreInventoryStock(firestore, { id: orderId, ...orderData });
  }

  await orderRef.delete();
  console.log(`[OrderService] Successfully deleted document ${orderId}`);
  return { id: orderId, success: true };
};
