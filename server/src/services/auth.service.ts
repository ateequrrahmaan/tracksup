import { db } from "./firebase.service.js";
import admin from "firebase-admin";

export const getUserContext = async (userId: string) => {
  const firestore = db();
  if (!firestore) {
    console.error("[AuthService] Firestore could not be initialized");
    throw new Error("Firestore not initialized");
  }

  // 1. Fetch User Profile
  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : { uid: userId };

    // 2. Fetch Memberships
    console.log(`[AuthService] Fetching memberships for user: ${userId}`);
    const membershipsSnapshot = await firestore.collection("memberships")
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .get();
    
    const memberships = membershipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[AuthService] Found ${memberships.length} active memberships for ${userId}`);
    const orgIds = memberships.map((m: any) => m.organizationId);

    // 3. Fetch Organizations
    let organizations: any[] = [];
    if (orgIds.length > 0) {
      // Use getAll for more efficient ID lookup
      const orgRefs = orgIds.slice(0, 30).map(id => firestore.doc(`organizations/${id}`));
      const orgsDocs = await firestore.getAll(...orgRefs);
      organizations = orgsDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return {
      user: userData,
      memberships,
      organizations
    };
  } catch (error: any) {
    if (error.message?.includes("NOT_FOUND")) {
      console.error("[AuthService] Firestore NOT_FOUND error. This usually means the Project ID or Database ID is incorrect, or Firestore is not enabled.");
      throw new Error("Firestore database not found. Please check your FIREBASE_PROJECT_ID and FIREBASE_DATABASE_ID (leave empty for (default) database).");
    }
    throw error;
  }
};

export const updateUser = async (userId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  await firestore.collection("users").doc(userId).set({
    ...data,
    updatedAt: new Date()
  }, { merge: true });

  return { uid: userId, ...data };
};
