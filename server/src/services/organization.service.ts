import { db } from "../services/firebase.service.js";

export const createOrganization = async (orgData: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const docRef = await firestore.collection("organizations").add({
    ...orgData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: docRef.id, ...orgData };
};

export const getOrganizationById = async (id: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const doc = await firestore.collection("organizations").doc(id).get();
  if (!doc.exists) return null;

  return { id: doc.id, ...doc.data() };
};

export const listOrganizationsForUser = async (userId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // In a real app, you'd have a memberships collection or organization.members array
  const snapshot = await firestore.collection("organizations")
    .where("ownerId", "==", userId)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
