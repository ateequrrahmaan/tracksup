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
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  selectedUnit?: string;
  displayQuantity?: number;
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
  measurementType?: string;
  baseUnit?: string;
  pricePerUnit?: number;
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
  vendorId: string;
  vendorName: string;
  completed?: boolean;
  purchasedQuantity?: number; // employee actual purchased qty
  purchaseCost?: number; // employee actual purchase cost per unit (unit cost)
  sellingPrice?: number; // supplier approved selling price
  margin?: number; // calculated margin %
  warehouseLocation?: string; // future-ready warehouse location string
  paymentMethod?: "Paid" | "Credit";
  notes?: string;
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

export enum MovementType {
  PROCUREMENT = "procurement",
  ORDER = "order",
  ADJUSTMENT = "adjustment",
  CORRECTION = "correction",
  TRANSFER = "transfer"
}

export enum VendorTransactionType {
  PROCUREMENT_CREDIT = "Procurement Credit",
  VENDOR_PAYMENT = "Vendor Payment",
  ADJUSTMENT = "Adjustment",
  REFUND = "Refund",
  WRITE_OFF = "Write-off"
}

export enum SettlementStatus {
  OUTSTANDING = "Outstanding",
  PARTIALLY_SETTLED = "Partially Settled",
  SETTLED = "Settled",
  COMPLETED = "Completed"
}

export interface VendorPaymentLedger {
  id: string;
  organizationId: string;
  vendorId: string;
  vendorName: string;
  transactionType: VendorTransactionType;
  amount: number;
  status: SettlementStatus;
  remainingAmount?: number;
  referenceType?: "procurement" | "payment" | "adjustment" | string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  productName: string;
  movementType: MovementType;
  quantity: number;
  direction: "in" | "out";
  sourceType: "vendor" | "retailer" | "manual" | "system" | "warehouse";
  sourceId?: string;
  sourceName?: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
