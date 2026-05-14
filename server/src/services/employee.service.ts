import { db } from "./firebase.service.js";

export const getMemberProfile = async (userId: string, orgId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const membership = await firestore.collection("memberships")
    .where("organizationId", "==", orgId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (membership.empty) return null;

  const userDoc = await firestore.collection("users").doc(userId).get();
  if (!userDoc.exists) return null;

  return { 
    id: userDoc.id, 
    ...userDoc.data(), 
    membership: membership.docs[0].data() 
  };
};

export const getMemberOrders = async (userId: string, orgId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // Fetch orders where the user is either the assigned employee or the initiating retailer
  // and the organization is involved (as either retailer or supplier)
  
  // 1. User as Employee in this org (org is supplier)
  const empOrders = await firestore.collection("orders")
    .where("supplierId", "==", orgId)
    .where("employeeId", "==", userId)
    .get();

  // 2. User as Retailer in this org (org is retailer)
  const retOrders = await firestore.collection("orders")
    .where("organizationId", "==", orgId)
    .where("retailerId", "==", userId)
    .get();

  const orders = [...empOrders.docs, ...retOrders.docs].map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort by updatedAt desc
  return orders.sort((a: any, b: any) => {
    const tA = (a.updatedAt?.toDate?.() || a.updatedAt || 0);
    const tB = (b.updatedAt?.toDate?.() || b.updatedAt || 0);
    return new Date(tB).getTime() - new Date(tA).getTime();
  });
};

export const getPerformanceStats = async (userId: string, orgId: string) => {
  const orders = await getMemberOrders(userId, orgId);
  const completed = orders.filter((o: any) => o.status === "delivered");
  
  return {
    total: orders.length,
    completed: completed.length,
    successRate: orders.length > 0 ? (completed.length / orders.length) * 100 : 0,
    lastActive: orders.length > 0 ? (orders[0] as any).updatedAt : null
  };
};
