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
  serverTimestamp, 
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Product, Vendor, Task, VendorPaymentLedger, SettlementStatus, VendorTransactionType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/constants";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Building, 
  Phone, 
  MapPin, 
  FileText, 
  Package, 
  TrendingUp, 
  ArrowLeft, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  Trash2,
  ListPlus,
  Coins,
  History,
  Wallet,
  Calendar,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";

export const SupplierVendors: React.FC = () => {
  const { activeOrg, preferredCurrency, user } = useAuth();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<VendorPaymentLedger[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Detail States
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "ledger" | "products">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  
  // Dialog States
  const [isNewVendorOpen, setIsNewVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isProductMapOpen, setIsProductMapOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Form States
  const [vendorName, setVendorName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [mappingProductIds, setMappingProductIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Payment Recording States
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Other">("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load real-time data
  useEffect(() => {
    if (!activeOrg) return;

    setLoading(true);
    
    // Subscribe to Vendors
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("supplierId", "==", activeOrg.id)
    );
    const unsubscribeVendors = onSnapshot(vendorsQuery, (snapshot) => {
      const vList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      setVendors(vList);
      setLoading(false);
    }, (err) => {
      console.error("Vendors subscription error:", err);
      handleFirestoreError(err, OperationType.GET, "vendors");
      setLoading(false);
    });

    // Subscribe to Products
    const productsQuery = query(
      collection(db, "products"),
      where("supplierId", "==", activeOrg.id)
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(pList);
    }, (err) => {
      console.error("Products subscription error:", err);
    });

    // Subscribe to Tasks (to extract procurement facts)
    const tasksQuery = query(
      collection(db, "tasks"),
      where("supplierId", "==", activeOrg.id),
      where("taskType", "==", "procurement")
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tList);
    }, (err) => {
      console.error("Tasks subscription error:", err);
    });

    // Subscribe to Vendor Payment Ledger
    const ledgerQuery = query(
      collection(db, "vendor_payment_ledger"),
      where("organizationId", "==", activeOrg.id)
    );
    const unsubscribeLedger = onSnapshot(ledgerQuery, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorPaymentLedger));
      setLedger(lList);
    }, (err) => {
      console.error("Ledger subscription error:", err);
    });

    return () => {
      unsubscribeVendors();
      unsubscribeProducts();
      unsubscribeTasks();
      unsubscribeLedger();
    };
  }, [activeOrg]);

  // Filter Vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const nameMatch = v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        v.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === "all" || v.status === filterStatus;
      return nameMatch && statusMatch;
    });
  }, [vendors, searchTerm, filterStatus]);

  // Handle Form submissions for Creating Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    if (!vendorName.trim()) {
      toast.error("Vendor Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const newVendorData = {
        supplierId: activeOrg.id,
        vendorName: vendorName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        productIds: [],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "vendors"), newVendorData);
      toast.success("Vendor registry initialized.");
      setIsNewVendorOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "vendors");
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-fill Edit Vendor Form
  const openEditVendor = (vendor: Vendor) => {
    setVendorName(vendor.vendorName);
    setPhone(vendor.phone);
    setAddress(vendor.address);
    setNotes(vendor.notes);
    setIsEditVendorOpen(true);
  };

  // Handle Update Vendor
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    setSubmitting(true);
    try {
      const vendorRef = doc(db, "vendors", selectedVendor.id);
      await updateDoc(vendorRef, {
        vendorName: vendorName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        updatedAt: serverTimestamp()
      });

      // Update selected state locally
      setSelectedVendor(prev => prev ? {
        ...prev,
        vendorName: vendorName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim()
      } : null);

      toast.success("Vendor definition updated.");
      setIsEditVendorOpen(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${selectedVendor.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle archving / active state
  const handleToggleArchiveVendor = async (vendor: Vendor) => {
    const newStatus = vendor.status === "active" ? "archived" : "active";
    const toastId = toast.loading(`Modifying registry status...`);
    try {
      const vendorRef = doc(db, "vendors", vendor.id);
      await updateDoc(vendorRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update selected state if currently viewing it
      if (selectedVendor && selectedVendor.id === vendor.id) {
        setSelectedVendor(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast.success(newStatus === "archived" ? "Vendor archived." : "Vendor activated.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Status adjustment failed.", { id: toastId });
    }
  };

  // Open Product Mapping UI
  const openProductMapping = () => {
    if (!selectedVendor) return;
    setMappingProductIds(selectedVendor.productIds || []);
    setIsProductMapOpen(true);
  };

  // Save Product Mapping
  const handleSaveProductMapping = async () => {
    if (!selectedVendor) return;
    setSubmitting(true);
    try {
      const vendorRef = doc(db, "vendors", selectedVendor.id);
      await updateDoc(vendorRef, {
        productIds: mappingProductIds,
        updatedAt: serverTimestamp()
      });

      setSelectedVendor(prev => prev ? { ...prev, productIds: mappingProductIds } : null);
      toast.success("Vendor product alignment configured successfully.");
      setIsProductMapOpen(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${selectedVendor.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle selection in the checkboxes for mapping
  const toggleMapProductSelection = (prodId: string) => {
    setMappingProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  // Record Vendor Payment (FIFO matching settlement logic)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !selectedVendor) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }

    if (amountNum > (vendorExtendedData?.outstandingBalance || 0)) {
      toast.warning(`Payment amount exceeds total outstanding balance. Maximum due is ${formatCurrency(vendorExtendedData?.outstandingBalance || 0, preferredCurrency)}.`);
      return;
    }

    setProcessingPayment(true);
    try {
      // Fetch outstanding / partially settled credit entries for FIFO deduction
      const ledgerColRef = collection(db, "vendor_payment_ledger");
      const creditsQuery = query(
        ledgerColRef,
        where("vendorId", "==", selectedVendor.id),
        where("transactionType", "==", "Procurement Credit"),
        where("status", "in", ["Outstanding", "Partially Settled"])
      );
      
      const creditsSnap = await getDocs(creditsQuery);
      
      // Sort by createdAt ascending in-memory
      const creditDocs = creditsSnap.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data()
      } as any)).sort((a, b) => {
        const secondsA = a.createdAt?.seconds || 0;
        const secondsB = b.createdAt?.seconds || 0;
        return secondsA - secondsB;
      });

      let remainingPayment = amountNum;
      const updates = [];

      for (const credit of creditDocs) {
        if (remainingPayment <= 0) break;

        const currentRemaining = credit.remainingAmount !== undefined ? credit.remainingAmount : credit.amount;

        if (remainingPayment >= currentRemaining) {
          remainingPayment -= currentRemaining;
          updates.push(updateDoc(credit.ref, {
            remainingAmount: 0,
            status: "Settled",
            updatedAt: serverTimestamp()
          }));
        } else {
          const newRemaining = currentRemaining - remainingPayment;
          remainingPayment = 0;
          updates.push(updateDoc(credit.ref, {
            remainingAmount: parseFloat(newRemaining.toFixed(2)),
            status: "Partially Settled",
            updatedAt: serverTimestamp()
          }));
        }
      }

      // Write master Vendor Payment entry
      await addDoc(collection(db, "vendor_payment_ledger"), {
        organizationId: activeOrg.id,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.vendorName,
        transactionType: "Vendor Payment",
        amount: amountNum,
        status: "Completed",
        referenceType: "payment",
        referenceNumber: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        notes: paymentNotes.trim() || `Recorded vendor payment via ${paymentMethod}`,
        createdBy: user?.name || user?.email || "Supplier Owner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Bulk resolve credits
      if (updates.length > 0) {
        await Promise.all(updates);
      }

      toast.success(`Recorded settlement of ${formatCurrency(amountNum, preferredCurrency)} successfully!`);
      
      // Reset payment variables
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentMethod("Cash");
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error("Recording payment failed:", err);
      toast.error("Failed to record vendor payment. Please verify permissions.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setVendorName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setMappingProductIds([]);
  };

  // Detailed Stats and History Calculations for specific vendor
  const vendorExtendedData = useMemo(() => {
    if (!selectedVendor) return null;

    // Filter procurement tasks for this vendor (single or multi-vendor)
    const vTasks = tasks.filter(t => 
      t.vendorId === selectedVendor.id || 
      (t.vendorId === "multi" && t.items?.some(item => item.vendorId === selectedVendor.id))
    );
    
    // Total Purchases Value (Approved & Stock Added ones)
    const completedOrApprovedTasks = vTasks.filter(t => ["awaiting_approval", "approved", "stock_added"].includes(t.status));
    
    let totalSpent = 0;
    completedOrApprovedTasks.forEach(task => {
      task.items?.forEach(item => {
        if (task.vendorId !== "multi" || item.vendorId === selectedVendor.id) {
          const qty = item.purchasedQuantity ?? item.quantity ?? 0;
          const cost = item.purchaseCost ?? 0;
          totalSpent += qty * cost;
        }
      });
    });

    // Chronological completed history
    const historyList = completedOrApprovedTasks
      .map(task => {
        let taskTotal = 0;
        const filteredItems = task.items?.filter(item => task.vendorId !== "multi" || item.vendorId === selectedVendor.id) || [];
        
        const itemsBreakdown = filteredItems.map(item => {
          const qty = item.purchasedQuantity ?? item.quantity ?? 0;
          const uCost = item.purchaseCost ?? 0;
          const lineTotal = qty * uCost;
          taskTotal += lineTotal;
          return `${item.productName} (${qty} x ${formatCurrency(uCost, preferredCurrency)})`;
        }).join(", ") || "No item log";

        // Find matching ledger credit entry to get its Settlement Status
        const matchingLedger = ledger.find(l => l.referenceId === task.id && l.vendorId === selectedVendor.id && l.transactionType === "Procurement Credit");
        const settlementStatus = task.paymentStatus === "Paid" ? "Settled" : (matchingLedger?.status || "Outstanding");
        const remainingAmt = task.paymentStatus === "Paid" ? 0 : (matchingLedger?.remainingAmount ?? taskTotal);

        return {
          id: task.id,
          title: task.title,
          status: task.status,
          date: task.updatedAt ? (task.updatedAt.toDate ? task.updatedAt.toDate().toLocaleDateString() : new Date(task.updatedAt as any).toLocaleDateString()) : "N/A",
          total: taskTotal,
          items: itemsBreakdown,
          paymentStatus: task.paymentStatus || "Paid",
          settlementStatus,
          remainingAmt
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate details from real-time ledger
    const vLedger = ledger
      .filter(l => l.vendorId === selectedVendor.id)
      .sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
        return tB - tA; // descending chronological
      });

    const totalPaid = vLedger
      .filter(l => l.transactionType === "Vendor Payment")
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    const outstandingBalance = vLedger
      .filter(l => l.transactionType === "Procurement Credit")
      .reduce((sum, l) => sum + (l.remainingAmount ?? l.amount ?? 0), 0);

    const creditPurchasesCount = vLedger
      .filter(l => l.transactionType === "Procurement Credit").length;

    return {
      history: historyList,
      totalSpent, // Total Sourced Purchases Value
      totalPaid, // Total Settlement Recorded
      outstandingBalance, // Outstanding Dues
      creditPurchasesCount, // Outstanding count of credit entries
      itemsCompletedCount: completedOrApprovedTasks.length,
      vLedger,
      recentTasks: vTasks.slice(0, 5)
    };
  }, [selectedVendor, tasks, ledger, preferredCurrency]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 md:px-6">
      
      {/* Detail view header switch */}
      {selectedVendor ? (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedVendor(null)}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-extrabold uppercase text-[10px] tracking-wider transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back to Vendors List
          </button>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Vendor Profile card */}
            <div className="w-full lg:w-1/3 space-y-6">
              <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-zinc-900 text-white p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Building className="h-6 w-6 text-zinc-300" />
                    </div>
                    <Badge variant={selectedVendor.status === "active" ? "success" : "secondary"}>
                      {selectedVendor.status}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight">{selectedVendor.vendorName}</h2>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mt-1">Vendor Reference</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {selectedVendor.phone && (
                    <div className="flex items-center gap-3 text-xs">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span className="font-semibold text-zinc-800">{selectedVendor.phone}</span>
                    </div>
                  )}
                  {selectedVendor.address && (
                    <div className="flex items-start gap-3 text-xs">
                      <MapPin className="h-4 w-4 text-zinc-400 mt-1 shrink-0" />
                      <span className="text-zinc-650">{selectedVendor.address}</span>
                    </div>
                  )}
                  {selectedVendor.notes && (
                    <div className="bg-zinc-50 rounded-2xl p-4 text-xs space-y-1">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Internal Notes</p>
                      <p className="text-zinc-650 leading-relaxed italic">"{selectedVendor.notes}"</p>
                    </div>
                  )}
                  <div className="border-t border-zinc-100 pt-6 flex flex-col gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => openEditVendor(selectedVendor)}
                      className="w-full rounded-2xl text-[10px] font-black uppercase tracking-wider h-11"
                    >
                      <Edit3 className="mr-2 h-4 w-4" /> Edit Vendor Info
                    </Button>
                    <Button 
                      variant={selectedVendor.status === "active" ? "secondary" : "default"}
                      onClick={() => handleToggleArchiveVendor(selectedVendor)}
                      className="w-full rounded-2xl text-[10px] font-black uppercase tracking-wider h-11"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {selectedVendor.status === "active" ? "Archive Vendor Record" : "Activate Vendor Record"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Products Supplied Grid */}
              <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-black uppercase italic tracking-tight">Supplied Products</CardTitle>
                      <CardDescription className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Category maps assigned</CardDescription>
                    </div>
                    <Button size="icon" variant="ghost" onClick={openProductMapping} className="rounded-xl h-9 w-9">
                      <ListPlus className="h-4 w-4 text-zinc-900" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {selectedVendor.productIds && selectedVendor.productIds.length > 0 ? (
                    <div className="space-y-2">
                      {products
                        .filter(p => selectedVendor.productIds.includes(p.id))
                        .map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
                            <span className="text-xs font-black uppercase tracking-tight text-zinc-800">{p.name}</span>
                            <Badge variant="outline" className="text-[9px] font-extrabold uppercase">
                              Price: {formatCurrency(p.price, p.currency || preferredCurrency)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-400">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold uppercase tracking-wide">No products mapped</p>
                      <Button size="sm" variant="link" className="text-xs uppercase font-extrabold mt-1" onClick={openProductMapping}>
                        Align Products
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vendor Performance & History dashboard */}
            <div className="flex-1 space-y-6">
              {/* Stats blocks overlay */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-none shadow-sm bg-white p-5 flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    (vendorExtendedData?.outstandingBalance ?? 0) > 0 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-zinc-50 text-zinc-400"
                  }`}>
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-wider leading-none mb-1">Outstanding Balance</p>
                    <p className={`text-lg font-black italic tracking-tighter leading-none ${
                      (vendorExtendedData?.outstandingBalance ?? 0) > 0 ? "text-rose-600" : "text-zinc-600"
                    }`}>
                      {formatCurrency(vendorExtendedData?.outstandingBalance ?? 0, preferredCurrency)}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm bg-white p-5 flex items-center gap-4">
                  <div className="h-11 w-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-wider leading-none mb-1">Total Settled Paid</p>
                    <p className="text-lg font-black italic tracking-tighter text-emerald-600 leading-none">
                      {formatCurrency(vendorExtendedData?.totalPaid ?? 0, preferredCurrency)}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm bg-white p-5 flex items-center gap-4">
                  <div className="h-11 w-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-wider leading-none mb-1">Credit Purchases</p>
                    <p className="text-lg font-black italic tracking-tighter text-indigo-600 leading-none">
                      {vendorExtendedData?.creditPurchasesCount ?? 0} Runs
                    </p>
                  </div>
                </Card>
              </div>

              {/* Repayment Settlement prompt bar */}
              {(vendorExtendedData?.outstandingBalance ?? 0) > 0 && (
                <Card className="rounded-[2rem] border-none bg-zinc-900 text-white p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tight">Credit Settlement Pending</h4>
                    <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mt-1">
                      Dues outstanding: {formatCurrency(vendorExtendedData?.outstandingBalance ?? 0, preferredCurrency)} are eligible for FIFO clearance.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="rounded-xl h-11 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold uppercase text-[10px] tracking-wider px-6 shadow-xl shrink-0"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> Record Vendor Payment
                  </Button>
                </Card>
              )}

              {/* Master Tab Bar Section */}
              <div className="flex border-b border-zinc-100 pb-2 overflow-x-auto scrollbar-none gap-2">
                {[
                  { id: "overview", label: "Statement Hub" },
                  { id: "history", label: "Procurement History" },
                  { id: "ledger", label: "Payment Ledger" },
                  { id: "products", label: "Products" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeTab === t.id 
                        ? "bg-zinc-900 text-white shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Outputs rendering switcher */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Vendor Statement View Card */}
                  <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em] leading-none mb-1">Company Record</p>
                          <h3 className="text-base font-black uppercase italic tracking-tight">{activeOrg?.name || "Tracksup Network"}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em] leading-none mb-1">Statement Date</p>
                          <p className="text-xs font-black text-zinc-900 italic">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-dashed border-zinc-100">
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-2">Vendor Particulars</p>
                          <h4 className="text-sm font-black text-zinc-900 uppercase leading-tight">{selectedVendor.vendorName}</h4>
                          {selectedVendor.phone && <p className="text-xs text-zinc-500 mt-1">Phone: {selectedVendor.phone}</p>}
                          {selectedVendor.address && <p className="text-xs text-zinc-550 mt-0.5">Address: {selectedVendor.address}</p>}
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">Status: <b className="text-emerald-600">{selectedVendor.status}</b></p>
                        </div>
                        <div className="space-y-2 text-right">
                          <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-2 text-left md:text-right">Statement Summary</p>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-500">Total Sourced Volume:</span>
                            <span className="text-zinc-900 font-bold">{formatCurrency(vendorExtendedData?.totalSpent ?? 0, preferredCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-500">Settlements Registered:</span>
                            <span className="text-emerald-600 font-bold">-{formatCurrency(vendorExtendedData?.totalPaid ?? 0, preferredCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black pt-2 border-t border-zinc-150">
                            <span className="text-zinc-900">Total Account Balance:</span>
                            <span className={(vendorExtendedData?.outstandingBalance ?? 0) > 0 ? "text-rose-600" : "text-zinc-800"}>
                              {formatCurrency(vendorExtendedData?.outstandingBalance ?? 0, preferredCurrency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Timeline view */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-zinc-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-850">Settlement Timeline Feed</h4>
                        </div>
                        
                        {vendorExtendedData && vendorExtendedData.vLedger.length > 0 ? (
                          <div className="relative pl-6 border-l border-zinc-200 ml-3 space-y-6 pt-2">
                            {vendorExtendedData.vLedger.slice(0, 5).map((l, idx) => {
                              const isPayment = l.transactionType === "Vendor Payment";
                              const dateStr = l.createdAt ? (l.createdAt.toDate ? l.createdAt.toDate().toLocaleDateString() : new Date(l.createdAt).toLocaleDateString()) : "N/A";
                              return (
                                <div key={l.id || idx} className="relative group">
                                  {/* Dot indicator */}
                                  <div className={`absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 bg-white transition-transform group-hover:scale-125 ${
                                    isPayment ? "border-emerald-500" : "border-rose-400"
                                  }`} />
                                  
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                      <p className="text-xs font-black uppercase italic tracking-tight text-zinc-800">
                                        {l.referenceNumber ? `${l.referenceNumber}: ` : ""}{l.transactionType}
                                      </p>
                                      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{l.notes}</p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                      <p className={`text-xs font-black italic ${isPayment ? "text-emerald-600" : "text-rose-600"}`}>
                                        {isPayment ? "-" : "+"}{formatCurrency(l.amount, preferredCurrency)}
                                      </p>
                                      <p className="text-[8px] text-zinc-400 font-extrabold uppercase">{dateStr}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-zinc-50 rounded-2xl p-6 text-center text-zinc-450 text-[10px] uppercase font-bold tracking-wider">
                            Timeline feed is currently blank. Credit purchases will compile automatically.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "history" && (
                <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black uppercase italic tracking-tight">Procurement History Table</CardTitle>
                    <CardDescription className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Historical Run Invoices and aging logs</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    {vendorExtendedData && vendorExtendedData.history.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-zinc-50/75 border-b border-zinc-100">
                          <TableRow>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider pl-6">Run Info / Date</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider">Supplied Contents</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider text-center">Settlement Status</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider text-right pr-6">Cost Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorExtendedData.history.map(item => (
                            <TableRow key={item.id} className="hover:bg-zinc-50 transition-colors">
                              <TableCell className="pl-6 py-4">
                                <p className="text-xs font-black text-zinc-900 uppercase italic">
                                  Run #{item.id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-[9px] text-zinc-400 font-bold">{item.date}</p>
                              </TableCell>
                              <TableCell className="py-4">
                                <p className="text-xs text-zinc-650 font-semibold line-clamp-1">{item.items}</p>
                                <div className="flex gap-2 items-center mt-1">
                                  <Badge className="text-[7px] font-black uppercase tracking-wider rounded-md py-0 px-2" variant="outline">
                                    {item.status.replace(/_/g, ' ')}
                                  </Badge>
                                  <Badge className="text-[7px] font-black uppercase tracking-wider rounded-md py-0 px-2">
                                    Terms: {item.paymentStatus}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-4">
                                <Badge 
                                  variant={
                                    item.settlementStatus === "Settled" 
                                      ? "success" 
                                      : (item.settlementStatus === "Partially Settled" ? "warning" : "destructive")
                                  }
                                  className="text-[8px] font-black uppercase tracking-wider py-0.5 rounded-md"
                                >
                                  {item.settlementStatus}
                                </Badge>
                                {item.settlementStatus === "Partially Settled" && (
                                  <p className="text-[8px] font-black text-rose-500 mt-1 leading-none">
                                    Due: {formatCurrency(item.remainingAmt, preferredCurrency)}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6 py-4">
                                <span className="text-sm font-black italic tracking-tight">
                                  {formatCurrency(item.total, preferredCurrency)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-16 text-zinc-400">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Zero Procurement Records</p>
                        <p className="text-[10px] text-zinc-404 mt-2 max-w-xs mx-auto">Once an employee initiates and completes a procurement task with credit terms, it records here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "ledger" && (
                <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black uppercase italic tracking-tight">Account Settlement Ledger</CardTitle>
                    <CardDescription className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Unified collection of credits, settlements and adjustment history</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 shadow-none">
                    {vendorExtendedData && vendorExtendedData.vLedger.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-zinc-50 border-b border-zinc-150">
                          <TableRow>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider pl-6">Posting Date</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider">Type / Ref No</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider">Operational Notes</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-wider text-right pr-6">Value Posting</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorExtendedData.vLedger.map((l, idx) => {
                            const dateForm = l.createdAt ? (l.createdAt.toDate ? l.createdAt.toDate().toLocaleDateString() : new Date(l.createdAt).toLocaleDateString()) : "N/A";
                            const isPayment = l.transactionType === "Vendor Payment";
                            return (
                              <TableRow key={l.id || idx} className="hover:bg-zinc-50 transition-colors">
                                <TableCell className="pl-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                    <span className="text-xs font-semibold text-zinc-900">{dateForm}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <p className="text-xs font-black uppercase italic tracking-tight text-zinc-900 leading-none mb-1">{l.transactionType}</p>
                                  <p className="text-[9px] font-bold text-zinc-450 uppercase leading-none">{l.referenceNumber || "PRC-CREDIT"}</p>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge 
                                    className="text-[8px] font-black uppercase py-0.5 rounded-md"
                                    variant={
                                      l.status === "Completed" || l.status === "Settled" 
                                        ? "success" 
                                        : (l.status === "Partially Settled" ? "warning" : "destructive")
                                    }
                                  >
                                    {l.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 text-xs font-medium text-zinc-600 max-w-[160px] truncate">
                                  {l.notes || "--"}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                  <span className={`text-xs font-black italic tracking-wide ${isPayment ? "text-emerald-600 animate-fade-in" : "text-rose-600"}`}>
                                    {isPayment ? "-" : "+"}{formatCurrency(l.amount, preferredCurrency)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-16 text-zinc-400 bg-zinc-50/50">
                        <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Ledger account is entirely clear</p>
                        <p className="text-[10px] text-zinc-404 font-bold mt-1 uppercase max-w-xs mx-auto">Procurement liabilities and payments post in real-time.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "products" && (
                <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-black uppercase italic tracking-tight">Sourced Catalog Mapping</CardTitle>
                        <CardDescription className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Identify align products in wholesale logistics</CardDescription>
                      </div>
                      <Button onClick={openProductMapping} className="rounded-xl text-[9px] font-black uppercase tracking-wider h-9">
                        <ListPlus className="mr-1 h-3.5 w-3.5" /> Configure Alignments
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {selectedVendor.productIds && selectedVendor.productIds.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products
                          .filter(p => selectedVendor.productIds.includes(p.id))
                          .map(p => (
                            <div key={p.id} className="flex flex-col justify-between p-5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/75 transition-all group border border-zinc-150">
                              <div className="space-y-1">
                                <p className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Product ID: {p.id.slice(-6).toUpperCase()}</p>
                                <h4 className="text-sm font-black uppercase text-zinc-800 tracking-tight">{p.name}</h4>
                              </div>
                              <div className="flex justify-between items-center pt-4 border-t border-zinc-150 mt-4">
                                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Wholesales Valuation</span>
                                <Badge variant="outline" className="text-[9px] font-extrabold uppercase py-0.5 px-2 bg-white">
                                  {formatCurrency(p.price, p.currency || preferredCurrency)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-400">
                        <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Product Mapping is blank</p>
                        <p className="text-[10px] text-zinc-404 mt-1 font-semibold max-w-sm mx-auto">No products catalog linked. Click standard launcher configuration on upper margin to align brand assets.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main List view */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-zinc-300">
                <Building className="h-6 w-6" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Vendor Control</h2>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1.5">
                    Source materials, manage manufacturers, and analyze intake pipelines
                  </p>
                </div>
                <Button 
                  onClick={() => setIsNewVendorOpen(true)}
                  className="rounded-2xl h-11 bg-white hover:bg-zinc-100 text-zinc-900 font-black uppercase tracking-widest text-[9px] shrink-0"
                >
                  <Plus className="mr-1 h-4 w-4" /> Initialize Vendor
                </Button>
              </div>
            </div>
          </div>

          {/* Search, Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                placeholder="Search vendors..." 
                className="pl-12 rounded-2xl h-12 border-none bg-white shadow-sm font-bold text-xs uppercase tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-zinc-100 self-stretch sm:self-auto justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilterStatus("all")}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
                  filterStatus === "all" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-500"
                }`}
              >
                All
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilterStatus("active")}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
                  filterStatus === "active" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-500"
                }`}
              >
                Active
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilterStatus("archived")}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
                  filterStatus === "archived" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-500"
                }`}
              >
                Archived
              </Button>
            </div>
          </div>

          {/* Vendors Feed Grid */}
          {loading ? (
            <div className="text-center py-24 opacity-60">
              <p className="text-xs uppercase font-black tracking-widest">Awaiting Registry Ledger Feed...</p>
            </div>
          ) : filteredVendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map(vendor => {
                const vendorTasks = tasks.filter(t => t.vendorId === vendor.id);
                const activeTasksCount = vendorTasks.filter(t => t.status !== "stock_added").length;
                
                return (
                  <Card 
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className="rounded-[2.2rem] border-none bg-white p-6 shadow-sm hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer group relative flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                          <Building className="h-5 w-5" />
                        </div>
                        <Badge variant={vendor.status === "active" ? "success" : "secondary"}>
                          {vendor.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-black text-base uppercase italic tracking-tight text-zinc-900 group-hover:text-zinc-955 line-clamp-1">
                          {vendor.vendorName}
                        </h3>
                        <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                          {vendor.productIds?.length || 0} Mapped Products
                        </p>
                      </div>
                      
                      {vendor.notes && (
                        <p className="text-xs text-zinc-500 italic line-clamp-2 mt-2 leading-relaxed">
                          "{vendor.notes}"
                        </p>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 pt-4 mt-6 flex justify-between items-center text-[10px] uppercase font-black text-zinc-400">
                      <span>Tasks: <b className="text-zinc-800">{activeTasksCount} Active</b></span>
                      <span className="text-zinc-900 underline group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Inspect Detail
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-[2.2rem] border-2 border-dashed border-zinc-200 py-16 text-center shadow-none flex flex-col items-center justify-center max-w-sm mx-auto bg-white/50">
              <Building className="h-10 w-10 text-zinc-300 mb-4" />
              <h3 className="font-black uppercase italic tracking-tight text-zinc-700 text-sm">Vendor Ledger Clear</h3>
              <p className="text-[10px] text-zinc-405 font-medium uppercase tracking-wide mt-2 px-6 text-zinc-450 leading-relaxed">
                Add vendors to establish product mappings and delegate inventory purchasing tasks to employees.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Initialize Vendor Dialog */}
      <Dialog open={isNewVendorOpen} onOpenChange={setIsNewVendorOpen}>
        <DialogContent className="rounded-[2.2rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Initialize Vendor</DialogTitle>
            <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Build vendor parameters on terminal registry
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVendor} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Vendor Name</Label>
              <Input 
                value={vendorName} 
                onChange={e => setVendorName(e.target.value)} 
                required 
                placeholder="e.g. Kumar Traders"
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Phone Number</Label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="e.g. +1 555-0199"
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Address Location</Label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="e.g. 15 Wholesale Rd, Sector 4"
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Internal Operational Notes</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Preferred vendor for soft beverages and packaging boxes"
                className="rounded-xl bg-zinc-50 border-none px-4 py-3 text-xs font-semibold min-h-[80px]"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-zinc-900 text-white"
              >
                {submitting ? "Registering..." : "Validate & Initialize"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="rounded-[2.2rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter font-sans">Modify Vendor</DialogTitle>
            <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Update parameters in global directory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVendor} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Vendor Name</Label>
              <Input 
                value={vendorName} 
                onChange={e => setVendorName(e.target.value)} 
                required 
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Phone Number</Label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Address Address</Label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Notes</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="rounded-xl bg-zinc-50 border-none px-4 py-3 text-xs font-semibold min-h-[80px]"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-zinc-900 text-white"
              >
                {submitting ? "Writing Registry..." : "Save Config Details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vendor Product Mapping Dialog */}
      <Dialog open={isProductMapOpen} onOpenChange={setIsProductMapOpen}>
        <DialogContent className="rounded-[2.2rem] p-8 border-none shadow-2xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Align Supplied Products</DialogTitle>
            <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Check which catalog items are sourced by this vendor
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[350px] my-6 pr-4 space-y-4">
            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map(p => {
                  const isChecked = mappingProductIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => toggleMapProductSelection(p.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer select-none transition-colors ${
                        isChecked ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-tight">{p.name}</p>
                        <p className={`text-[9px] font-extrabold ${isChecked ? "text-zinc-400" : "text-zinc-500"}`}>
                          Base Selling: {formatCurrency(p.price, p.currency || preferredCurrency)}
                        </p>
                      </div>
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                        isChecked ? "bg-white text-zinc-900 border-white" : "border-zinc-300"
                      }`}>
                        {isChecked && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-450 leading-none">Catalog is empty</p>
                <p className="text-[10px] text-zinc-404 mt-1">Please create products first under your main Catalog tab.</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button 
              onClick={handleSaveProductMapping}
              disabled={submitting || products.length === 0}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-zinc-900 text-white shadow-xl shadow-zinc-100"
            >
              Update Product Configurations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Vendor Payment Dialog */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="rounded-[2.2rem] p-10 border-none shadow-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Record Vendor Payment</DialogTitle>
            <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Post settlement payment posting to vendor ledger
            </DialogDescription>
          </DialogHeader>

          {selectedVendor && (
            <form onSubmit={handleRecordPayment} className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl text-xs">
                <div>
                  <p className="text-[8px] font-black uppercase text-zinc-400">Selected Vendor</p>
                  <p className="font-bold text-zinc-900 mt-0.5 max-w-[170px] truncate">{selectedVendor.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-rose-450">Outstanding Due</p>
                  <p className="font-black italic text-rose-600 mt-0.5">
                    {formatCurrency(vendorExtendedData?.outstandingBalance ?? 0, preferredCurrency)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Repayment Amount ({preferredCurrency})</Label>
                <Input 
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  required
                  className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
                <p className="text-[8px] text-zinc-400 italic">Enter amount to deduct from oldest outstanding credits first (FIFO format).</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Payment Date</Label>
                  <Input 
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Payment Method</Label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full h-12 rounded-xl bg-zinc-50 border-none px-4 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-zinc-950 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Settlement Note / Reference</Label>
                <Textarea 
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Bank transfer reference #BB92X10"
                  className="rounded-xl bg-zinc-50 border-none px-4 py-3 text-xs font-semibold min-h-[60px] focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="submit" 
                  disabled={processingPayment}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-zinc-900 text-white shadow-lg"
                >
                  {processingPayment ? "Registering Posting..." : "Deeds Cleared & Post Payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
