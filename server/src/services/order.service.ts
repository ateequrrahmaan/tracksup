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

  await orderRef.update({
    status: "delivered",
    payment_status: deliveryData.paymentStatus,
    amount_collected: deliveryData.amountCollected,
    delivered_at: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deliveredBy: deliveryData.userId,
    note: deliveryData.note || ""
  });

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

  // Determine if caller is supplier or retailer
  const isSupplierAction = orgId === supplierId;
  console.log("[OrderService] Action type:", isSupplierAction ? "Supplier" : "Retailer/Other");
  
  if (isSupplierAction) {
    console.log("[OrderService] Verifying supplier membership for user:", userId, "in org:", supplierId);
    const supplierMembership = await firestore.collection("memberships")
      .where("userId", "==", userId)
      .where("organizationId", "==", supplierId)
      .get();
    
    console.log("[OrderService] Supplier memberships found:", supplierMembership.size);
    const hasPermission = supplierMembership.docs.some(doc => {
      const role = doc.data().role;
      return ['owner', 'admin', 'supplier', 'retailer'].includes(role);
    });

    if (!hasPermission) {
      console.error("[OrderService] Unauthorized supplier action. User roles:", supplierMembership.docs.map(d => d.data().role));
      throw new Error("Unauthorized to order from this supplier. Your role doesn't permit order creation.");
    }
  } else {
    // 2. Caller is (presumably) the retailer. Verify connection to supplier.
    console.log("[OrderService] Verifying retailer connection. User:", userId, "Connected to Supplier Org:", supplierId);
    const membership = await firestore.collection("memberships")
      .where("userId", "==", userId)
      .where("organizationId", "==", supplierId)
      .where("status", "==", "active")
      .get();

    console.log("[OrderService] Connections found:", membership.size, "Roles:", membership.docs.map(d => d.data().role));

    // The connecting membership role should be 'retailer'
    const isConnected = membership.docs.some(doc => doc.data().role === 'retailer');

    if (!isConnected) {
      console.error("[OrderService] No active 'retailer' membership found for user in supplier org");
      throw new Error("You are not connected to this supplier as a retailer. Please accept an invite first.");
    }
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
