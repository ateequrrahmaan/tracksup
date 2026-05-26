import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.service.js";

export const listProducts = async (supplierId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const snapshot = await firestore.collection("products")
    .where("supplierId", "==", supplierId)
    .orderBy("name", "asc")
    .limit(200)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createProduct = async (supplierId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const productData = {
    ...data,
    supplierId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  const docRef = await firestore.collection("products").add(productData);
  return { id: docRef.id, ...productData };
};

export const updateProduct = async (productId: string, supplierId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const docRef = firestore.collection("products").doc(productId);
  const doc = await docRef.get();
  
  if (!doc.exists) throw new Error("Product not found");
  if (doc.data()?.supplierId !== supplierId) throw new Error("Unauthorized to update this product");

  const productData = {
    ...data,
    updatedAt: FieldValue.serverTimestamp()
  };

  await docRef.update(productData);
  return { id: productId, ...productData };
};

export const deleteProduct = async (productId: string, supplierId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const docRef = firestore.collection("products").doc(productId);
  const doc = await docRef.get();

  if (!doc.exists) throw new Error("Product not found");
  if (doc.data()?.supplierId !== supplierId) throw new Error("Unauthorized to delete this product");

  await docRef.delete();
  return { success: true };
};

export const listMarketplaceProducts = async (retailerId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // Find all memberships for this user as retailer
  const memberships = await firestore.collection("memberships")
    .where("userId", "==", retailerId)
    .where("role", "==", "retailer")
    .get();

  const supplierIds = memberships.docs.map(doc => doc.data().organizationId);
  if (supplierIds.length === 0) return [];

  // Fetch products for these suppliers
  // Note: 'in' is limited to 10. If more, we need multiple queries. 
  // Keeping it simple for now.
  const snapshot = await firestore.collection("products")
    .where("supplierId", "in", supplierIds.slice(0, 10))
    .get();

  // Get supplier names
  const supplierSnapshot = await firestore.collection("organizations")
    .where("__name__", "in", supplierIds.slice(0, 10))
    .get();
  
  const supplierNames = new Map();
  supplierSnapshot.docs.forEach(doc => supplierNames.set(doc.id, doc.data().name));

  return snapshot.docs
    .filter(doc => doc.data().status !== "hidden")
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        supplierName: supplierNames.get(data.supplierId) || "Unknown Supplier"
      };
    });
};
