import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  User, 
  Trash2, 
  Calendar, 
  Loader2, 
  PlusCircle, 
  MinusCircle, 
  Building, 
  Package, 
  Info,
  ChevronRight,
  TrendingUp,
  MapPin,
  Check,
  RefreshCw,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { Task, SystemUser, Vendor, Product, ProcurementItem, VendorTransactionType, SettlementStatus } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/constants";

interface SupplierTasksProps {
  employees: SystemUser[];
}

export const SupplierTasks: React.FC<SupplierTasksProps> = ({ employees }) => {
  const { activeOrg, preferredCurrency, user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // New task form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskType, setTaskType] = useState<"checklist" | "procurement">("checklist");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  
  // Checklist dynamic creation state
  const [rawChecklistItems, setRawChecklistItems] = useState<string[]>([""]);

  // Procurement creation state (Multi-vendor block architecture)
  interface ProcurementBlock {
    vendorId: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }
  const [procurementBlocks, setProcurementBlocks] = useState<ProcurementBlock[]>([
    { vendorId: "", items: [{ productId: "", quantity: 1 }] }
  ]);
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Credit">("Paid");

  const [submitting, setSubmitting] = useState(false);

  // Review & Approval States
  const [reviewTask, setReviewTask] = useState<Task | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [sellingPrices, setSellingPrices] = useState<Record<string, number>>({});
  const [warehouseLocations, setWarehouseLocations] = useState<Record<string, string>>({});
  const [processingAction, setProcessingAction] = useState(false);

  // Subscribe to Tasks, Vendors, Products
  useEffect(() => {
    if (!activeOrg) return;

    setLoading(true);
    
    // Subscribe to Tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("supplierId", "==", activeOrg.id)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setTasks(docs);
      setLoading(false);
    }, (err) => {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, "tasks");
      setLoading(false);
    });

    // Subscribe to Vendors
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("supplierId", "==", activeOrg.id)
    );
    const unsubscribeVendors = onSnapshot(vendorsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      setVendors(docs);
    });

    // Subscribe to Products
    const productsQuery = query(
      collection(db, "products"),
      where("supplierId", "==", activeOrg.id)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeVendors();
      unsubscribeProducts();
    };
  }, [activeOrg]);

  // Compute products supplied by any given vendor
  const getProductsForVendor = (vId: string) => {
    if (!vId) return [];
    const vendor = vendors.find(v => v.id === vId);
    if (!vendor || !vendor.productIds || vendor.productIds.length === 0) {
      // Fallback: return all products if vendor has no registered products
      return products;
    }
    return products.filter(p => vendor.productIds.includes(p.id));
  };

  // Handle Checklist Items Edit
  const addChecklistItemField = () => {
    setRawChecklistItems([...rawChecklistItems, ""]);
  };

  const updateChecklistItemFieldValue = (index: number, val: string) => {
    const updated = [...rawChecklistItems];
    updated[index] = val;
    setRawChecklistItems(updated);
  };

  const removeChecklistItemField = (index: number) => {
    if (rawChecklistItems.length === 1) return;
    setRawChecklistItems(rawChecklistItems.filter((_, idx) => idx !== index));
  };

  // Handle Procurement dynamic multi-vendor blocks edit
  const addProcurementVendorBlock = () => {
    setProcurementBlocks([
      ...procurementBlocks,
      { vendorId: "", items: [{ productId: "", quantity: 1 }] }
    ]);
  };

  const removeProcurementVendorBlock = (vendorIndex: number) => {
    if (procurementBlocks.length === 1) {
      toast.error("You need at least one procuring source.");
      return;
    }
    setProcurementBlocks(procurementBlocks.filter((_, idx) => idx !== vendorIndex));
  };

  const updateProcurementVendorId = (vendorIndex: number, vId: string) => {
    const updated = [...procurementBlocks];
    updated[vendorIndex] = {
      ...updated[vendorIndex],
      vendorId: vId,
      items: [{ productId: "", quantity: 1 }]
    };
    setProcurementBlocks(updated);
  };

  const addProcurementProductToBlock = (vendorIndex: number) => {
    const updated = [...procurementBlocks];
    updated[vendorIndex].items.push({ productId: "", quantity: 1 });
    setProcurementBlocks(updated);
  };

  const removeProcurementProductFromBlock = (vendorIndex: number, productIndex: number) => {
    const updated = [...procurementBlocks];
    if (updated[vendorIndex].items.length === 1) {
      toast.error("A source must purchase at least one item.");
      return;
    }
    updated[vendorIndex].items = updated[vendorIndex].items.filter((_, idx) => idx !== productIndex);
    setProcurementBlocks(updated);
  };

  const updateProcurementProductInBlock = (
    vendorIndex: number,
    productIndex: number,
    field: "productId" | "quantity",
    value: any
  ) => {
    const updated = [...procurementBlocks];
    updated[vendorIndex].items[productIndex] = {
      ...updated[vendorIndex].items[productIndex],
      [field]: value
    };
    setProcurementBlocks(updated);
  };

  // Build Checklist and Procurement Dispatching Tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;

    if (!title.trim() || !assignedEmployeeId) {
      toast.error("Title and Assignee are required.");
      return;
    }

    if (taskType === "checklist") {
      const validItems = rawChecklistItems.filter(item => item.trim() !== "");
      if (validItems.length === 0) {
        toast.error("Please add at least one valid checklist item.");
        return;
      }
    } else {
      // Multi-sourcing checks
      const hasUnassignedVendor = procurementBlocks.some(b => !b.vendorId);
      if (hasUnassignedVendor) {
        toast.error("Please make sure all sourcing blocks have an assigned vendor.");
        return;
      }
      
      const hasInvalidItem = procurementBlocks.some(b => 
        b.items.some(i => !i.productId || i.quantity <= 0)
      );
      if (hasInvalidItem) {
        toast.error("Please make sure all product selections and quantity counts are configured.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const selectedEmp = employees.find(emp => emp.uid === assignedEmployeeId);
      const employeeName = selectedEmp ? selectedEmp.name : "Unknown Employee";

      const commonFields = {
        title: title.trim(),
        description: description.trim(),
        supplierId: activeOrg.id,
        employeeId: assignedEmployeeId,
        employeeName,
        taskType,
        priority,
        dueDate: dueDate || null,
        status: "assigned", // V2 standard entry status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      let taskData: any = { ...commonFields };

      if (taskType === "checklist") {
        taskData.checklist = rawChecklistItems
          .filter(item => item.trim() !== "")
          .map(item => ({ text: item.trim(), completed: false }));
      } else {
        const flatItems: ProcurementItem[] = [];
        
        for (const block of procurementBlocks) {
          const vendor = vendors.find(v => v.id === block.vendorId);
          const vName = vendor ? vendor.vendorName : "Unknown Vendor";
          
          for (const item of block.items) {
            const prod = products.find(p => p.id === item.productId);
            const pName = prod ? prod.name : "Unknown Product";
            
            flatItems.push({
              vendorId: block.vendorId,
              vendorName: vName,
              productId: item.productId,
              productName: pName,
              quantity: item.quantity,
              completed: false
            });
          }
        }
        
        taskData.items = flatItems;
        taskData.paymentStatus = paymentStatus;
        
        if (procurementBlocks.length === 1) {
          const singleVendor = vendors.find(v => v.id === procurementBlocks[0].vendorId);
          taskData.vendorId = procurementBlocks[0].vendorId;
          taskData.vendorName = singleVendor ? singleVendor.vendorName : "Unknown Vendor";
        } else {
          taskData.vendorId = "multi";
          taskData.vendorName = `${procurementBlocks.length} Sourced Vendors`;
        }
      }

      await addDoc(collection(db, "tasks"), taskData);
      toast.success(`${taskType === "checklist" ? "Checklist" : "Procurement"} directive dispatch successful!`);
      
      // Reset Form fields
      setTitle("");
      setDescription("");
      setAssignedEmployeeId("");
      setPriority("medium");
      setDueDate("");
      setRawChecklistItems([""]);
      setProcurementBlocks([{ vendorId: "", items: [{ productId: "", quantity: 1 }] }]);
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "tasks");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Purge this operational directive?")) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Directive purged from registry.");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  // Unified status toggles or reviews
  const handleToggleLegacyStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "assigned" : "completed";
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Directive updated to ${newStatus}.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Open detailed Review Dialog for procurement task
  const openReviewDialog = (task: Task) => {
    setReviewTask(task);
    
    // Initialize selling prices with product's current prices
    const prices: Record<string, number> = {};
    const locations: Record<string, string> = {};
    
    task.items?.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      prices[item.productId] = item.sellingPrice || prod?.price || 0;
      locations[item.productId] = item.warehouseLocation || "";
    });

    setSellingPrices(prices);
    setWarehouseLocations(locations);
    setIsReviewOpen(true);
  };

  // Transition Step 1: Approve Checklist/Procurement Task Purchases
  const handleApprovePurchases = async () => {
    if (!reviewTask) return;
    setProcessingAction(true);
    
    try {
      // Calculate margins and save selling prices
      const updatedItems = reviewTask.items?.map(item => {
        const sprice = sellingPrices[item.productId] || 0;
        const pcost = item.purchaseCost ?? 0;
        const margin = sprice > 0 ? ((sprice - pcost) / sprice) * 100 : 0;
        
        return {
          ...item,
          sellingPrice: sprice,
          margin: parseFloat(margin.toFixed(2))
        };
      });

      const taskRef = doc(db, "tasks", reviewTask.id);
      await updateDoc(taskRef, {
        status: "approved", // Transition to Approved (Pending Stock Intake)
        items: updatedItems,
        updatedAt: serverTimestamp()
      });

      // Automatically create Vendor Liability Ledger entry if task is on Credit
      if (reviewTask.paymentStatus === "Credit" && updatedItems && activeOrg) {
        // Group items by vendorId to support multi-vendor credit entries
        const vendorTotals: Record<string, { vendorName: string; total: number }> = {};
        
        updatedItems.forEach(item => {
          if (!item.vendorId) return;
          const qty = item.purchasedQuantity ?? item.quantity ?? 0;
          const cost = item.purchaseCost ?? 0;
          const lineAmt = qty * cost;
          
          if (lineAmt > 0) {
            if (!vendorTotals[item.vendorId]) {
              vendorTotals[item.vendorId] = {
                vendorName: item.vendorName || "Unknown Vendor",
                total: 0
              };
            }
            vendorTotals[item.vendorId].total += lineAmt;
          }
        });

        for (const [vId, info] of Object.entries(vendorTotals)) {
          await addDoc(collection(db, "vendor_payment_ledger"), {
            organizationId: activeOrg.id,
            vendorId: vId,
            vendorName: info.vendorName,
            transactionType: VendorTransactionType.PROCUREMENT_CREDIT,
            amount: info.total,
            status: SettlementStatus.OUTSTANDING,
            remainingAmount: info.total,
            referenceType: "procurement",
            referenceId: reviewTask.id,
            referenceNumber: `PRC-${reviewTask.id.slice(-6).toUpperCase()}`,
            notes: `Liability recorded from approved procurement mission #${reviewTask.id.slice(-6).toUpperCase()}`,
            createdBy: user?.name || user?.email || "Supplier Owner",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      toast.success("Procurement approved. Pending Stock Intake.");
      setIsReviewOpen(false);
      setReviewTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Approval state transition failed.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Transition Step 2: Final Integration (Commit Stock Intake)
  const handleCommitStockIntake = async () => {
    if (!reviewTask || !activeOrg) return;
    setProcessingAction(true);
    const toastId = toast.loading("Executing inventory intake routines...");

    try {
      // Loop through items and update products collection
      for (const item of reviewTask.items || []) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await getDoc(prodRef);
        
        const loc = warehouseLocations[item.productId] || "Main Section";
        
        if (prodSnap.exists()) {
          const prodData = prodSnap.data();
          const currentStock = prodData.stock || 0;
          const purchasedQty = item.purchasedQuantity ?? item.quantity;
          const newStock = currentStock + purchasedQty;
          
          // Formulate intake history logs
          const historyEntry = {
            date: new Date().toISOString(),
            quantity: purchasedQty,
            cost: item.purchaseCost ?? 0,
            vendorName: reviewTask.vendorName || "Vendor Sourced",
            warehouseLocation: loc,
            note: `Integrated from Procurement Run #${reviewTask.id.slice(-6).toUpperCase()}`
          };

          const restockHistory = prodData.restockHistory || [];
          
          await updateDoc(prodRef, {
            stock: newStock,
            price: sellingPrices[item.productId] || prodData.price, // Update product selling price to match approved if changed
            restockHistory: [...restockHistory, historyEntry],
            updatedAt: serverTimestamp()
          });

          // Log movement entry
          await addDoc(collection(db, "inventory_movements"), {
            organizationId: activeOrg.id,
            productId: item.productId,
            productName: item.productName,
            movementType: "procurement",
            quantity: purchasedQty,
            direction: "in",
            sourceType: "vendor",
            sourceId: item.vendorId || "",
            sourceName: item.vendorName || reviewTask.vendorName || "Vendor Sourced",
            referenceId: reviewTask.id,
            referenceNumber: `PRC-${reviewTask.id.slice(-6).toUpperCase()}`,
            notes: `Integrated from Procurement Mission Run by ${reviewTask.employeeName || "employee"}. Location: ${loc}.`,
            performedBy: reviewTask.employeeName || "Procurement Agent",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      // Update the items within the task with warehouse location too
      const updatedItems = reviewTask.items?.map(item => ({
        ...item,
        warehouseLocation: warehouseLocations[item.productId] || "Main Section"
      }));

      // Update Task status
      const taskRef = doc(db, "tasks", reviewTask.id);
      await updateDoc(taskRef, {
        status: "stock_added", // Fully complete status
        items: updatedItems,
        updatedAt: serverTimestamp()
      });

      toast.success("Inventory integration committed. Available stock incremented.", { id: toastId });
      setIsReviewOpen(false);
      setReviewTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Inventory intake integration failed.", { id: toastId });
    } finally {
      setProcessingAction(false);
    }
  };

  // Status-based task counts
  const stats = useMemo(() => {
    const total = tasks.length;
    
    // Checklist specific
    const clTotal = tasks.filter(t => t.taskType === "checklist").length;
    const clCompleted = tasks.filter(t => t.taskType === "checklist" && t.status === "completed").length;
    
    // Procurement specific
    const prTotal = tasks.filter(t => t.taskType === "procurement").length;
    const prStocked = tasks.filter(t => t.taskType === "procurement" && t.status === "stock_added").length;
    const prPendingApproval = tasks.filter(t => t.taskType === "procurement" && t.status === "awaiting_approval").length;
    const prApprovedPendingStock = tasks.filter(t => t.taskType === "procurement" && t.status === "approved").length;

    return { 
      total, 
      clTotal, 
      clCompleted, 
      prTotal, 
      prStocked, 
      prPendingApproval, 
      prApprovedPendingStock 
    };
  }, [tasks]);

  // Filters application
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vendorName || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesEmployee = employeeFilter === "all" || t.employeeId === employeeFilter;
      const matchesType = typeFilter === "all" || t.taskType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesEmployee && matchesType;
    });
  }, [tasks, searchTerm, statusFilter, employeeFilter, typeFilter]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-zinc-850" /> Operations Ledger
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Dispatch, manage, and verify checklist & procurement operations
          </p>
        </div>
        <div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 font-black uppercase text-[11px] tracking-widest bg-zinc-900 text-white hover:bg-zinc-850 shadow-xl transition-all hover:scale-[1.02]">
                <Plus className="mr-2 h-4 w-4" /> Dispatch Operational Task
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl rounded-3xl border-none shadow-2xl p-8 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase mb-1 flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-zinc-900" /> Dispatch New Task
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
                  Assign dynamic checklist or product procurement tasks
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-6 mt-6">
                
                {/* Task Type Sizing Selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Task Category</Label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                    <Button
                      type="button"
                      variant="ghost" 
                      onClick={() => setTaskType("checklist")}
                      className={`rounded-xl px-4 py-3 text-[10px] h-11 font-black uppercase tracking-wider ${
                        taskType === "checklist" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                      }`}
                    >
                      Checklist Task
                    </Button>
                    <Button
                      type="button"
                      variant="ghost" 
                      onClick={() => setTaskType("procurement")}
                      className={`rounded-xl px-4 py-3 text-[10px] h-11 font-black uppercase tracking-wider ${
                        taskType === "procurement" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                      }`}
                    >
                      Procurement Task
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Task Title</Label>
                    <Input 
                      placeholder={taskType === "checklist" ? "e.g. Prep refrigeration room" : "e.g. Sourcing Soft Drinks"} 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-50 border-none font-semibold text-xs text-zinc-900"
                      required
                    />
                  </div>

                  {/* Assign Operations Employee */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Crew Person</Label>
                    <Select value={assignedEmployeeId} onValueChange={setAssignedEmployeeId}>
                      <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-semibold text-xs text-zinc-900 shadow-none">
                        <SelectValue placeholder="Assign Employee" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl p-2 max-h-56">
                        {employees.map((emp) => (
                          <SelectItem key={emp.uid} value={emp.uid} className="font-semibold text-xs py-3 rounded-lg">
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Task Priority</Label>
                    <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                      <SelectTrigger className="h-12 rounded-xl bg-zinc-50 border-none font-semibold text-xs text-zinc-900 shadow-none">
                        <SelectValue placeholder="Priority Block" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl p-2">
                        <SelectItem value="low" className="font-semibold text-xs py-2 rounded-lg">Low Focus</SelectItem>
                        <SelectItem value="medium" className="font-semibold text-xs py-2 rounded-lg">Medium Focus</SelectItem>
                        <SelectItem value="high" className="font-semibold text-xs py-2 rounded-lg text-rose-500">High Focus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Limit Due Date</Label>
                    <Input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-12 rounded-xl bg-zinc-50 border-none font-semibold text-xs text-zinc-900 shadow-none"
                    />
                  </div>
                </div>

                {/* Detailed Instructions */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Operational Guidelines</Label>
                  <Textarea 
                    placeholder="Provide specific notes and details to assist staff completion..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[70px] rounded-xl bg-zinc-50 border-none font-medium text-xs text-zinc-800 p-4"
                  />
                </div>

                {/* DYNAMIC CATEGORY DEPENDENT FORMS */}
                {taskType === "checklist" ? (
                  <div className="space-y-3 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Checklist Sequence Verification</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={addChecklistItemField}
                        className="text-indigo-600 font-extrabold uppercase text-[9px] hover:bg-white"
                      >
                        <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Step
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {rawChecklistItems.map((itemValue, idx) => (
                        <div key={`cl-field-${idx}`} className="flex items-center gap-2">
                          <Input
                            placeholder={`Operational step #${idx + 1}`}
                            value={itemValue}
                            onChange={(e) => updateChecklistItemFieldValue(idx, e.target.value)}
                            className="h-11 rounded-xl bg-white border-zinc-200 text-xs font-semibold"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={rawChecklistItems.length === 1}
                            onClick={() => removeChecklistItemField(idx)}
                            className="rounded-lg h-11 w-11 text-zinc-400 hover:text-red-500 hover:bg-white"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Procurement flow setup (Redesigned multi-vendor and multi-product interface)
                  <div className="space-y-4 bg-zinc-50 rounded-3xl p-5 border border-zinc-100">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sourcing Terms & Sourced Vendors</Label>
                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Connect multiple vendors and products under one mission</p>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addProcurementVendorBlock}
                        className="text-indigo-600 font-extrabold uppercase text-[9px] hover:bg-white"
                      >
                        <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Vendor Source
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Display Vendor Blocks */}
                      <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
                        {procurementBlocks.map((block, vIdx) => {
                          const associatedProducts = getProductsForVendor(block.vendorId);
                          return (
                            <div key={`vendor-block-${vIdx}`} className="bg-white p-4 rounded-2.5xl border border-zinc-100 space-y-3 relative">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-zinc-400">
                                  Sourcing Vendor #{vIdx + 1}
                                </span>
                                {procurementBlocks.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeProcurementVendorBlock(vIdx)}
                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 text-[8px] font-black uppercase tracking-widest px-2.5 rounded-lg"
                                  >
                                    Remove Vendor Source
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-2.5">
                                <Select
                                  value={block.vendorId}
                                  onValueChange={(val) => updateProcurementVendorId(vIdx, val)}
                                >
                                  <SelectTrigger className="h-11 rounded-xl bg-zinc-50 border-none font-semibold text-xs text-zinc-900 shadow-none">
                                    <SelectValue placeholder="Pick Vendor Sourced" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-none shadow-2xl p-2 max-h-56">
                                    {vendors.map((v) => (
                                      <SelectItem key={v.id} value={v.id} className="font-semibold text-xs py-3.5 rounded-lg">
                                        {v.vendorName} ({v.productIds?.length || 0} mapped)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {block.vendorId && (
                                  <div className="space-y-2 pt-1 border-t border-zinc-50">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400">
                                      <span>Catalog Products Selection</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addProcurementProductToBlock(vIdx)}
                                        className="text-emerald-700 font-extrabold uppercase text-[8px] h-6 px-2 hover:bg-zinc-50"
                                      >
                                        <PlusCircle className="mr-1 h-3 w-3" /> Append Item
                                      </Button>
                                    </div>

                                    <div className="space-y-2">
                                      {block.items.map((prodItem, pIdx) => (
                                        <div key={`p-item-${pIdx}`} className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                                          <div className="flex-1">
                                            <Select
                                              value={prodItem.productId}
                                              onValueChange={(val) => updateProcurementProductInBlock(vIdx, pIdx, "productId", val)}
                                            >
                                              <SelectTrigger className="h-9 border-none bg-white rounded-lg text-xs font-semibold focus:outline-none shadow-sm">
                                                <SelectValue placeholder="Select product item..." />
                                              </SelectTrigger>
                                              <SelectContent className="rounded-xl border-none shadow-2xl p-2 max-h-56 max-w-sm">
                                                {associatedProducts.map((p) => (
                                                  <SelectItem key={p.id} value={p.id} className="font-semibold text-xs py-2 rounded-lg">
                                                    {p.name} (Selling: {formatCurrency(p.price, p.currency || preferredCurrency)})
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="w-20">
                                            <Input
                                              type="number"
                                              min={1}
                                              placeholder="Qty"
                                              value={prodItem.quantity}
                                              onChange={(e) => updateProcurementProductInBlock(vIdx, pIdx, "quantity", parseInt(e.target.value) || 1)}
                                              className="h-9 border-none bg-white rounded-lg text-xs font-semibold text-center shadow-sm"
                                            />
                                          </div>
                                          {block.items.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => removeProcurementProductFromBlock(vIdx, pIdx)}
                                              className="rounded-md h-9 w-9 text-zinc-300 hover:text-red-500 hover:bg-white"
                                            >
                                              <MinusCircle className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsCreateOpen(false)}
                    className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-850 font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-zinc-200"
                  >
                    {submitting ? "Deploying..." : "Dispatch Crew Directive"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Unified Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[1.8rem] border-none shadow-sm bg-white p-6 transition-all hover:shadow-md flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Runs Logged</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black italic tracking-tight text-zinc-900">{stats.total}</span>
              <span className="text-sm font-bold text-zinc-500">Directives</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-between items-center text-[10px]">
            <span className="font-medium text-zinc-400 uppercase tracking-wider">Classification</span>
            <span className="font-bold text-zinc-600 uppercase tracking-widest">Checklist/Procure</span>
          </div>
        </Card>
        
        <Card className="rounded-[1.8rem] border-none shadow-sm bg-blue-50/40 border border-blue-100 p-6 transition-all hover:shadow-md flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Checklist Runs</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black italic tracking-tight text-blue-800">{stats.clTotal - stats.clCompleted}</span>
              <span className="text-sm font-bold text-blue-500">Active Runs</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-100/50 flex justify-between items-center text-[10px]">
            <span className="font-medium text-blue-400 uppercase tracking-wider">Completed</span>
            <span className="font-extrabold text-blue-600 uppercase tracking-widest">{stats.clCompleted} Closed</span>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-none shadow-sm bg-amber-50/40 border border-amber-100 p-6 transition-all hover:shadow-md flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Purchase Review</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black italic tracking-tight text-amber-800">{stats.prPendingApproval}</span>
              <span className="text-sm font-bold text-amber-500">Awaiting</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100/50 flex justify-between items-center text-[10px]">
            <span className="font-medium text-amber-400 uppercase tracking-wider">Gate Review</span>
            <span className="font-extrabold text-amber-600 uppercase tracking-widest">Gate Block</span>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-none shadow-sm bg-emerald-50/40 border border-emerald-100 p-6 transition-all hover:shadow-md flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Approved Pending Intake</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black italic tracking-tight text-emerald-800">{stats.prApprovedPendingStock}</span>
              <span className="text-sm font-bold text-emerald-500">Sourced</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100/50 flex justify-between items-center text-[10px]">
            <span className="font-medium text-emerald-400 uppercase tracking-wider">Inventory</span>
            <span className="font-extrabold text-emerald-600 uppercase tracking-widest">{stats.prStocked} Stocked</span>
          </div>
        </Card>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full lg:max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <Input 
            placeholder="Search operational ledger directives..." 
            className="pl-12 rounded-2xl h-12 border-none bg-white shadow-sm font-bold text-xs uppercase tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full lg:w-auto">
          {/* Option Filters */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-white border-none shadow-sm font-black uppercase text-[9px] tracking-widest text-zinc-900 w-full sm:w-40">
              <SelectValue placeholder="Category Type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-1.5">
              <SelectItem value="all" className="font-bold uppercase text-[9px] tracking-widest">All Types</SelectItem>
              <SelectItem value="checklist" className="font-bold uppercase text-[9px] tracking-widest">Checklists</SelectItem>
              <SelectItem value="procurement" className="font-bold uppercase text-[9px] tracking-widest">Procurements</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-white border-none shadow-sm font-black uppercase text-[9px] tracking-widest text-zinc-900 w-full sm:w-44">
              <SelectValue placeholder="Run Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-1.5 max-h-72">
              <SelectItem value="all" className="font-bold uppercase text-[9px] tracking-widest">All Statuses</SelectItem>
              <SelectItem value="assigned" className="font-bold uppercase text-[9px] tracking-widest">Assigned</SelectItem>
              <SelectItem value="accepted" className="font-bold uppercase text-[9px] tracking-widest">Accepted</SelectItem>
              <SelectItem value="in_progress" className="font-bold uppercase text-[9px] tracking-widest">In Progress</SelectItem>
              <SelectItem value="completed" className="font-bold uppercase text-[9px] tracking-widest">Completed</SelectItem>
              <SelectItem value="verified" className="font-bold uppercase text-[9px] tracking-widest">Verified</SelectItem>
              <SelectItem value="purchased" className="font-bold uppercase text-[9px] tracking-widest text-blue-500">Purchased</SelectItem>
              <SelectItem value="awaiting_approval" className="font-bold uppercase text-[9px] tracking-widest text-amber-500">Awaiting Price Review</SelectItem>
              <SelectItem value="approved" className="font-bold uppercase text-[9px] tracking-widest text-indigo-500">Pending Intake</SelectItem>
              <SelectItem value="stock_added" className="font-bold uppercase text-[9px] tracking-widest text-emerald-600">Approved & Stocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="h-12 rounded-2xl bg-white border-none shadow-sm font-black uppercase text-[9px] tracking-widest text-zinc-900 w-full sm:w-44">
              <SelectValue placeholder="Assigned Crew" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-1.5 max-h-56">
              <SelectItem value="all" className="font-bold uppercase text-[9px] tracking-widest py-2">All Crew Members</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={`task-emp-${emp.uid}`} value={emp.uid} className="font-medium text-xs">
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Listing Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
          <p className="text-[10px] font-black uppercase tracking-widest italic text-zinc-500">Awaiting Directive Feed...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              // Custom colors matching states
              const isChecklist = task.taskType === "checklist";
              let badgeColorClass = "bg-zinc-100 text-zinc-700";
              if (task.status === "completed" || task.status === "stock_added" || task.status === "verified") {
                badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
              } else if (task.status === "awaiting_approval" || task.status === "purchased") {
                badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-200";
              } else if (task.status === "approved") {
                badgeColorClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
              } else if (task.status === "in_progress" || task.status === "accepted") {
                badgeColorClass = "bg-blue-50 text-blue-700 border border-blue-200";
              }

              // Progress values for Checklists
              const checklistTotal = task.checklist?.length || 0;
              const checklistDone = task.checklist?.filter(i => i.completed).length || 0;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <Card className="rounded-[2.2rem] border-none shadow-sm overflow-hidden flex flex-col h-full bg-white transition-all hover:shadow-xl group relative">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <Badge className="font-extrabold uppercase text-[8px] tracking-[0.1em] px-2.5 py-1 rounded-full border-none bg-zinc-900 text-white">
                              {task.taskType}
                            </Badge>
                            <Badge className={`font-black uppercase text-[8px] tracking-[0.05em] px-2.5 py-1 rounded-full border-none ${badgeColorClass}`}>
                              {task.status.replace(/_/g, ' ')}
                            </Badge>
                            {task.priority && (
                              <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-[8px] font-extrabold uppercase py-0.5 px-2">
                                {task.priority} Focus
                              </Badge>
                            )}
                          </div>
                          
                          <CardTitle className="text-base font-black text-zinc-950 uppercase italic tracking-tight line-clamp-1">
                            {task.title}
                          </CardTitle>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-zinc-400 hover:text-rose-500 shrink-0 h-9 w-9 rounded-full hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Dynamic Body content depending on checklist / procurement type */}
                    <CardContent className="flex-1 pb-4 space-y-4">
                      {task.description && (
                        <p className="text-zinc-500 text-xs leading-relaxed whitespace-pre-wrap italic">
                          "{task.description}"
                        </p>
                      )}

                      {/* Checklist Summary */}
                      {isChecklist && (
                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-2">
                          <div className="flex justify-between items-center text-[10px] uppercase font-black text-zinc-400">
                            <span>Steps Sequence Checklist</span>
                            <span className="text-zinc-800">{checklistDone}/{checklistTotal} Done</span>
                          </div>
                          <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-zinc-900 h-full transition-all duration-300"
                              style={{ width: `${checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <div className="space-y-1.5 pt-2 max-h-[120px] overflow-y-auto">
                            {task.checklist?.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                                <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 ${
                                  item.completed ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300 bg-white"
                                }`}>
                                  {item.completed && <Check className="h-3 w-3" />}
                                </div>
                                <span className={item.completed ? "line-through text-zinc-400" : ""}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Procurement Summary facts */}
                      {!isChecklist && (
                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
                          <div className="flex justify-between items-center border-b border-zinc-100 pb-2 text-[10px] uppercase font-black text-zinc-400">
                            <span className="inline-flex items-center gap-1"><Building className="h-3.5 w-3.5 text-zinc-400" /> Vendor Sourced</span>
                            <span className="text-zinc-800 italic font-black">{task.vendorName}</span>
                          </div>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                            {task.items?.map((pItem, idx) => {
                              const qtyRequested = pItem.quantity;
                              const qtyPurchased = pItem.purchasedQuantity;
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-750">
                                  <span>{pItem.productName}</span>
                                  <span className="text-zinc-500 text-[11px]">
                                    Req: {qtyRequested} {qtyPurchased !== undefined && `| Got: ${qtyPurchased}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {task.paymentStatus && (
                            <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-400 pt-1 border-t border-zinc-150">
                              <span>Payment Flow Type</span>
                              <span>{task.paymentStatus}</span>
                            </div>
                          )}
                          {task.employeeNotes && (
                            <div className="text-[10px] text-zinc-500 italic border-t border-zinc-150 pt-2 font-medium">
                              <b>Purchaser Note:</b> "{task.employeeNotes}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Crew Assignment Person block */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-zinc-150 flex items-center justify-center text-zinc-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Assigned Crew</p>
                            <p className="text-xs font-black text-zinc-805 line-clamp-1">{task.employeeName}</p>
                          </div>
                        </div>
                        {task.dueDate && (
                          <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">Limit Due</p>
                            <p className="text-xs font-semibold text-zinc-700 flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" /> {task.dueDate}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    {/* Procurement Review Gateways Trigger / Checklist approvals */}
                    <CardFooter className="bg-zinc-50 p-4 border-t border-zinc-100 flex gap-2">
                      {isChecklist ? (
                        <Button 
                          onClick={() => handleToggleLegacyStatus(task)}
                          variant={task.status === "completed" ? "outline" : "default"}
                          className={`w-full rounded-2xl font-black uppercase text-[9px] tracking-widest h-11 transition-all ${
                            task.status === "completed" 
                              ? "bg-transparent border-zinc-200 text-zinc-750 hover:bg-zinc-100" 
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                          }`}
                        >
                          {task.status === "completed" ? (
                            <span className="flex items-center justify-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Re-open checklist</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Verify Completion</span>
                          )}
                        </Button>
                      ) : (
                        // Procurement buttons based on state
                        <>
                          {task.status === "awaiting_approval" && (
                            <Button 
                              onClick={() => openReviewDialog(task)}
                              className="w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700 font-black uppercase text-[9px] tracking-widest h-11 shadow-sm flex items-center justify-center gap-1"
                            >
                              <TrendingUp className="h-4 w-4" /> Review prices & Approve
                            </Button>
                          )}
                          {task.status === "approved" && (
                            <Button 
                              onClick={() => openReviewDialog(task)}
                              className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase text-[9px] tracking-widest h-11 shadow-sm flex items-center justify-center gap-1"
                            >
                              <MapPin className="h-4 w-4" /> Align Warehouses & Receive Stock
                            </Button>
                          )}
                          {task.status === "stock_added" && (
                            <div className="w-full py-2.5 text-center text-emerald-700 text-[10px] font-black uppercase tracking-wider bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Registry Integrated & Stocked
                            </div>
                          )}
                          {["assigned", "accepted", "in_progress"].includes(task.status) && (
                            <div className="w-full py-2.5 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-zinc-100 rounded-xl">
                              Awaiting Employee Purchase
                            </div>
                          )}
                        </>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="rounded-[2.2rem] border-2 border-dashed border-zinc-200 shadow-none py-16 text-center bg-white flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="font-black uppercase italic tracking-tight text-zinc-800 text-lg">Operational Ledger Clear</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-2 max-w-sm px-6">
            Allocate and direct staff actions using either dynamic checklists or procurement pipelines using the dispatch menu.
          </p>
        </Card>
      )}

      {/* Advanced Procurement Review & Approval Stepped dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        {reviewTask && (
          <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                    {reviewTask.status === "approved" ? "Warehousing Intake" : "Purchase Review Gate"}
                  </DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Run #{reviewTask.id.slice(-6).toUpperCase()} validation parameters
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              
              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl text-[11px] uppercase font-black text-zinc-500">
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-400">Staff Sourced</p>
                  <p className="text-zinc-800 font-black">{reviewTask.employeeName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-400">Term Terms & Sourcing</p>
                  <p className="text-zinc-800 font-black">{reviewTask.vendorName} ({reviewTask.paymentStatus})</p>
                </div>
              </div>

              {reviewTask.employeeNotes && (
                <div className="bg-amber-50/50 p-4 rounded-xl text-xs space-y-1 border border-amber-100">
                  <p className="text-[9px] font-black uppercase text-amber-600">Employee purchasing summary notes</p>
                  <p className="text-zinc-700 italic">"{reviewTask.employeeNotes}"</p>
                </div>
              )}

              {/* Items price mapping values validation tables */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Procured Items & Pricing Control</p>
                <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase pl-4">Item Sourced</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-center">Req / Rec</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right">Cost Price</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right pr-4">Active Selling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewTask.items?.map((item) => {
                        const recQty = item.purchasedQuantity ?? item.quantity;
                        const uCost = item.purchaseCost ?? 0;
                        const sellPrice = sellingPrices[item.productId] ?? 0;
                        const marginPercent = sellPrice > 0 ? ((sellPrice - uCost) / sellPrice) * 100 : 0;
                        const prod = products.find(p => p.id === item.productId);

                        return (
                          <TableRow key={item.productId} className="hover:bg-zinc-50 transition-colors">
                            <TableCell className="pl-4 py-3.5">
                              <p className="text-xs font-black uppercase tracking-tight text-zinc-800">{item.productName}</p>
                              {reviewTask.status !== "approved" && (
                                <p className={`text-[9px] uppercase font-bold mt-1 ${marginPercent >= 20 ? "text-emerald-600" : "text-amber-600"}`}>
                                  Margin: {marginPercent.toFixed(1)}%
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-xs font-extrabold text-zinc-700 py-3.5">
                              {item.quantity} / <b className="text-zinc-900">{recQty}</b>
                            </TableCell>
                            <TableCell className="text-right text-xs font-extrabold text-zinc-800 py-3.5">
                              {formatCurrency(uCost, preferredCurrency)}
                              <p className="text-[9px] text-zinc-400 font-bold">Total: {formatCurrency(recQty * uCost, preferredCurrency)}</p>
                            </TableCell>
                            <TableCell className="text-right pr-4 py-3.5">
                              {reviewTask.status === "approved" ? (
                                // Read-only for stocking step
                                <span className="text-sm font-black italic tracking-wide">
                                  {formatCurrency(sellPrice, preferredCurrency)}
                                </span>
                              ) : (
                                // Editable selling price on approval step
                                <div className="flex items-center gap-1 justify-end max-w-[110px] ml-auto">
                                  <span className="text-xs font-semibold text-zinc-400">{preferredCurrency}</span>
                                  <Input 
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={sellPrice}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setSellingPrices(prev => ({ ...prev, [item.productId]: val }));
                                    }}
                                    className="h-9 text-xs font-black text-right rounded-lg w-16"
                                  />
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Step 2 Warehouse Assignment setup */}
              {reviewTask.status === "approved" && (
                <div className="space-y-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 leading-none">
                    <MapPin className="h-4 w-4" /> Warehouse Intake Assignment Options
                  </p>
                  <p className="text-[10px] text-indigo-600 font-medium">
                    Map newly received products to shelves/bins to enable automated fleet lookup.
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    {reviewTask.items?.map((item) => (
                      <div key={`loc-${item.productId}`} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-black uppercase text-zinc-700">{item.productName}</span>
                        <Input 
                          placeholder="e.g. Shelf A-3, Cold Bin"
                          value={warehouseLocations[item.productId] ?? ""}
                          onChange={(e) => setWarehouseLocations(prev => ({ ...prev, [item.productId]: e.target.value }))}
                          className="h-10 text-xs font-semibold bg-white border-zinc-200 rounded-lg max-w-[200px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-8 flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsReviewOpen(false);
                  setReviewTask(null);
                }}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest flex-1 border border-zinc-200"
              >
                Cancel Review
              </Button>
              {reviewTask.status === "approved" ? (
                <Button 
                  onClick={handleCommitStockIntake}
                  disabled={processingAction}
                  className="h-14 rounded-2xl bg-indigo-600 text-white hover:bg-zinc-900 font-black uppercase text-[10px] tracking-widest px-8 flex-1 shadow-lg shadow-zinc-100"
                >
                  {processingAction ? "Committing Stocks..." : "Confirm Inventory Intake Integration"}
                </Button>
              ) : (
                <Button 
                  onClick={handleApprovePurchases}
                  disabled={processingAction}
                  className="h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 font-black uppercase text-[10px] tracking-widest px-8 flex-1 shadow-lg shadow-zinc-200"
                >
                  {processingAction ? "Validating Gating..." : "Validate & Progress Tasks"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
