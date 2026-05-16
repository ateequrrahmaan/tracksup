import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../services/firebase.service.js";

export const createOrganization = async (orgData: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // CHECK: If user already has ANY active membership
  const existingMemberships = await firestore.collection("memberships")
    .where("userId", "==", orgData.ownerId)
    .where("status", "==", "active")
    .get();
  
  if (!existingMemberships.empty) {
    const memberships = existingMemberships.docs.map(d => d.data());
    const isRetailerOnly = memberships.every(m => m.role === 'retailer');
    const creatingRetailer = orgData.type === 'retailer';

    if (!isRetailerOnly || !creatingRetailer) {
      throw new Error("You already have an active membership in another organization. Only retailers can maintain multiple organization connections.");
    }
  }

  const batch = firestore.batch();
  
  const orgRef = firestore.collection("organizations").doc();
  batch.set(orgRef, {
    ...orgData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const membershipRef = firestore.collection("memberships").doc(`${orgData.ownerId}_${orgRef.id}`);
  batch.set(membershipRef, {
    organizationId: orgRef.id,
    userId: orgData.ownerId,
    role: orgData.type || "supplier", 
    status: "active",
    joinedAt: new Date(),
  });

  await batch.commit();
  console.log(`[OrgService] Created organization ${orgRef.id} and membership for user ${orgData.ownerId}`);
  return { id: orgRef.id, ...orgData };
};

export const getOrganizationById = async (id: string, userId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const doc = await firestore.collection("organizations").doc(id).get();
  if (!doc.exists) return null;

  return { id: doc.id, ...doc.data() };
};

export const joinByInvite = async (token: string, userId: string, email: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const inviteRef = firestore.collection("invites").doc(token);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) throw new Error("Invite not found");
  
  const inviteData = inviteDoc.data()!;
  if (inviteData.status !== "pending") throw new Error("Invite already processed");
  
  // Handle both Timestamp and Date objects
  const expiresAt = inviteData.expiresAt instanceof Date 
    ? inviteData.expiresAt 
    : (inviteData.expiresAt?.toDate ? inviteData.expiresAt.toDate() : new Date(inviteData.expiresAt));

  if (expiresAt < new Date()) throw new Error("Invite expired");
  
  // CHECK: If user already has active memberships
  const existingMemberships = await firestore.collection("memberships")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();
  
  if (!existingMemberships.empty) {
    const memberships = existingMemberships.docs.map(d => d.data());
    const existingOrgIds = memberships.map(m => m.organizationId);
    
    if (existingOrgIds.includes(inviteData.organizationId)) {
      throw new Error("You are already an active member of this organization");
    }

    const joiningAsRetailer = inviteData.role === 'retailer';
    const isCurrentlyRetailerOnly = memberships.every(m => m.role === 'retailer');

    if (!joiningAsRetailer || !isCurrentlyRetailerOnly) {
      throw new Error("You already have an active membership in another organization. Retailers can join multiple suppliers, but employees are restricted to one organization at a time.");
    }
  }

  const batch = firestore.batch();
  const membershipRef = firestore.collection("memberships").doc(`${userId}_${inviteData.organizationId}`);

  batch.set(membershipRef, {
    userId,
    organizationId: inviteData.organizationId,
    role: inviteData.role,
    status: "active",
    joinedAt: new Date()
  });

  batch.update(inviteRef, {
    status: "accepted",
    acceptedBy: userId,
    updatedAt: new Date()
  });

  await batch.commit();
  return { id: inviteData.organizationId };
};

export const createInvite = async (orgId: string, orgName: string, userId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);

  const inviteData = {
    organizationId: orgId,
    organizationName: orgName,
    email: data.email,
    role: data.role,
    token,
    status: "pending",
    invitedBy: userId,
    createdAt: FieldValue.serverTimestamp()
  };
  
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await firestore.collection("invites").doc(token).set({
    ...inviteData,
    expiresAt
  });

  return { token };
};

export const deleteInvite = async (token: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  await firestore.collection("invites").doc(token).delete();
  return { success: true };
};

export const listOrganizationsForUser = async (userId: string) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // 1. Get all memberships for the user
  const membershipsSnapshot = await firestore.collection("memberships")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  const orgIds = membershipsSnapshot.docs.map(doc => doc.data().organizationId);

  if (orgIds.length === 0) return [];

  // 2. Get organization details for those IDs
  // Note: Standard Firestore limit for 'in' query is 30. 
  // If a user has >30 orgs, this would need batching.
  const orgsSnapshot = await firestore.collection("organizations")
    .where("__name__", "in", orgIds)
    .get();

  return orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateOrganization = async (orgId: string, userId: string, data: any) => {
  const firestore = db();
  if (!firestore) throw new Error("Firestore not initialized");

  // Verify membership and role (only admin/owner should update)
  const membership = await firestore.collection("memberships")
    .where("organizationId", "==", orgId)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (membership.empty) throw new Error("Access denied");
  
  const memberData = membership.docs[0].data();
  // Simplified check: owner/admin role (supplier/retailer are the owner roles here)
  if (!['supplier', 'retailer'].includes(memberData.role)) {
    throw new Error("Only organization owners can update settings");
  }

  await firestore.collection("organizations").doc(orgId).update({
    ...data,
    updatedAt: new Date()
  });

  return { id: orgId, ...data };
};
