import { Timestamp } from "firebase/firestore";

export type UserRole = "supplier" | "employee" | "retailer";

export interface SystemUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  currency?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  currency?: string;
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
  employeeName?: string;
  supplierName?: string;
  status: "pending" | "assigned" | "out_for_delivery" | "delivered";
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  deliveryDate: string;
  payment_status?: "paid" | "unpaid" | "credit";
  amount_collected?: number;
  delivered_at?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  stock?: number;
  unitCost?: number;
  status?: "active" | "hidden";
  restockHistory?: Array<{
    quantityAdded: number;
    unitCost: number;
    totalCost: number;
    date: string;
    notes?: string;
  }>;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  supplierId: string;
  employeeId: string;
  employeeName: string;
  status: "pending" | "completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
