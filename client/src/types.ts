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
  status: "active" | "suspended" | "inactive";
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

export interface Vendor {
  id: string;
  supplierId: string;
  vendorName: string;
  phone: string;
  address: string;
  notes: string;
  productIds: string[]; // mapped product IDs Supplied by this vendor
  status: "active" | "archived";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskType = "checklist" | "procurement";
export type TaskPriority = "low" | "medium" | "high";

export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface ProcurementItem {
  productId: string;
  productName: string;
  quantity: number; // supplier requested qty
  purchasedQuantity?: number; // employee actual purchased qty
  purchaseCost?: number; // employee actual purchase cost per unit
  sellingPrice?: number; // supplier approved selling price
  margin?: number; // calculated margin %
  warehouseLocation?: string; // future-ready warehouse location string
}

export interface Task {
  id: string;
  title: string;
  description: string;
  supplierId: string;
  employeeId: string;
  employeeName: string;
  taskType: TaskType;
  priority?: TaskPriority;
  dueDate?: string; // YYYY-MM-DD format
  status: string; // "pending" | "completed" for legacy, or TaskStatus values: "assigned" | "accepted" | "in_progress" | "completed" | "verified" | "purchased" | "awaiting_approval" | "approved" | "stock_added"
  
  // Checklist fields
  checklist?: ChecklistItem[];
  
  // Procurement fields
  vendorId?: string;
  vendorName?: string;
  items?: ProcurementItem[];
  paymentStatus?: "Paid" | "Credit";
  employeeNotes?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
