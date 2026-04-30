import { Timestamp } from "firebase/firestore";

export type UserRole = "supplier" | "employee" | "retailer";

export interface SystemUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  status: "active" | "suspended";
}

export interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  token: string;
  status: "pending" | "accepted" | "expired" | "rejected";
  expiresAt: Timestamp;
  invitedBy: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  organizationId: string;
  supplierId: string;
  retailerId: string;
  retailerName: string;
  employeeId?: string;
  status: "pending" | "assigned" | "out_for_delivery" | "delivered";
  totalAmount: number;
  items: OrderItem[];
  deliveryDate: string;
  payment_status?: "paid" | "unpaid" | "credit";
  amount_collected?: number;
  delivered_at?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
