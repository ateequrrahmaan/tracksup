import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { safeFormat } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, LogOut, Download, Store, Settings, LayoutDashboard, History, CreditCard, FileText, Eye, ChevronRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order, SystemUser } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, getCurrencySymbol } from "@/constants";
import { DashboardLayout } from "../shared/DashboardLayout";
import api from "@/services/api";

const getPaymentBadge = (status?: string) => {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Paid</Badge>;
    case "unpaid": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Unpaid</Badge>;
    case "credit": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Credit</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateInvoice: (order: Order) => void;
  fetchedOrgs: Record<string, string>;
  organizations: Record<string, any>;
}

import { RetailerSuppliers } from "./components/RetailerSuppliers";
import { RetailerMarketplace } from "./components/RetailerMarketplace";
import { SettingsView } from "../shared/SettingsView";

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onOpenChange, onGenerateInvoice, fetchedOrgs, organizations }) => {
  if (!order) return null;
  const supplierName = (order as any).supplierName || fetchedOrgs[order.supplierId || ""] || organizations[order.supplierId || ""]?.name || "Supplier";
  
  const steps = ["pending", "assigned", "out_for_delivery", "delivered"];
  const currentStep = steps.indexOf(order.status);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex justify-between items-start pr-8">
            <div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">{supplierName}</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Manifest #{order.id.slice(-8).toUpperCase()} • {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPPp') : 'Processing...'}
              </DialogDescription>
            </div>
            <Badge variant={order.status === "delivered" ? "success" : "default"} as any>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="py-6 space-y-8">
           <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 italic">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-zinc-100">
                 <Store className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Distribution Source</p>
                 <p className="text-sm font-black uppercase text-zinc-900">{supplierName}</p>
              </div>
           </div>

        <div className="space-y-6 py-4">
          <div className="relative flex justify-between px-2 pt-4">
            <div className="absolute top-9 left-4 right-4 h-0.5 bg-zinc-100 -z-0" />
            <div className="absolute top-9 left-4 right-4 h-0.5 bg-primary transition-all duration-500 -z-0" 
                 style={{ width: `${(currentStep / 3) * 100}%` }} />
            
            {[
              { label: "Placed", icon: Clock },
              { label: "Assigned", icon: CheckCircle },
              { label: "Shipped", icon: Truck },
              { label: "Delivered", icon: CheckCircle }
            ].map((step, i) => (
              <div key={`modal-step-${i}`} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 bg-white ${currentStep >= i ? 'border-primary text-primary' : 'border-zinc-200 text-zinc-400'}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase ${currentStep >= i ? 'text-zinc-900' : 'text-zinc-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <div className="border rounded-lg p-4 bg-zinc-50/50">
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">Order Breakdown</h4>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={`modal-item-${idx}`} className="flex justify-between text-sm">
                  <span className="text-zinc-700">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity, order.currency)}</span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-bold text-zinc-900">
                <span>Total Amount</span>
                <span>{formatCurrency(order.totalAmount, order.currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-600 uppercase">Payment Info</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Status:</span>
                  {getPaymentBadge(order.payment_status)}
                </div>
                <p className="text-sm text-zinc-700">Collected: {formatCurrency(order.amount_collected || 0, order.currency)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-600 uppercase">Delivery Info</p>
              <p className="text-sm font-semibold">Date: {order.delivered_at ? safeFormat(order.delivered_at, 'PPP', 'Not yet') : 'Not yet'}</p>
              <p className="text-sm text-zinc-700">Agent: {order.employeeName || (order.employeeId ? `Agent ${order.employeeId.slice(-4).toUpperCase()}` : 'Assigned')}</p>
            </div>
          </div>
        </div>
      </div>
        
      <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => onGenerateInvoice(order)}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface InvoicePreviewModalProps {
  order: Order | null;
  orgName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (order: Order) => void;
  fetchedOrgs: Record<string, string>;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ order, orgName, isOpen, onOpenChange, onDownload, fetchedOrgs }) => {
  if (!order) return null;
  const symbol = getCurrencySymbol(order.currency);
  const supplierName = (order as any).supplierName || fetchedOrgs[order.supplierId || ""] || "Supplier";
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <div className="bg-white p-8 md:p-12">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-2xl font-black italic uppercase tracking-tighter">TracksUp</span>
              </div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900">INVOICE</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Invoice Number</p>
              <p className="font-black italic uppercase tracking-tight text-lg underline decoration-zinc-100 decoration-4 underline-offset-4">#{order.id.slice(0, 12).toUpperCase()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-4 mb-1">Issue Date</p>
              <p className="font-bold text-sm">{format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(), 'PPP')}</p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-12 mb-12 pb-12 border-b border-zinc-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Issued By</p>
              <p className="font-black italic uppercase text-lg">{supplierName}</p>
              <p className="text-sm text-zinc-500 mt-1">Network Verified Provider</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Billed To</p>
              <p className="font-black italic uppercase text-lg">{order.retailerName || "Valued Retailer"}</p>
              <p className="text-sm text-zinc-500 mt-1">{orgName || "Authorized Logistics Endpoint"}</p>
            </div>
          </div>

          {/* Table */}
          <div className="mb-12">
             <Table>
                <TableHeader className="bg-zinc-50 border-y border-zinc-100">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 h-12">Description</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 h-12 text-center">Quantity</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 h-12 text-right">Price</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 h-12 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item, idx) => (
                    <TableRow key={`invoice-item-${idx}`} className="border-b border-zinc-50">
                      <TableCell className="py-6">
                        <p className="font-black italic uppercase text-xs text-zinc-900">{item.name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Logistics Unit</p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-sm">{symbol}{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black italic text-sm">{symbol}{(item.quantity * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-12">
             <div className="w-full max-w-xs space-y-3 bg-zinc-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                <div className="flex justify-between items-center opacity-80">
                   <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                   <span className="text-xs font-bold">{formatCurrency(order.totalAmount, order.currency)}</span>
                </div>
                <div className="flex justify-between items-center opacity-80">
                   <span className="text-[10px] font-black uppercase tracking-widest">Network Tax</span>
                   <span className="text-xs font-bold">$0.00</span>
                </div>
                <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 leading-none">Grand Total</span>
                   <span className="text-3xl font-black italic tracking-tighter leading-none">{formatCurrency(order.totalAmount, order.currency)}</span>
                </div>
             </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 italic">
              Verification Hash: {order.id.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="bg-zinc-50 p-6 flex justify-end gap-3 rounded-b-3xl">
           <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px] italic h-12 px-8 rounded-xl" onClick={() => onOpenChange(false)}>
              Close Preview
           </Button>
           <Button className="font-black uppercase tracking-widest text-[10px] italic h-12 px-8 rounded-xl bg-zinc-900 shadow-xl" onClick={() => onDownload(order)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useLocation, useNavigate } from "react-router-dom";

export const RetailerDashboard = () => {
  const { user, memberships, activeOrg, organizations, switchOrg, preferredCurrency } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const activeTab = useMemo(() => {
    if (location.pathname === "/retailer") return "overview";
    if (location.pathname === "/retailer/orders") return "orders";
    if (location.pathname === "/retailer/history") return "history";
    if (location.pathname === "/retailer/suppliers") return "suppliers";
    if (location.pathname === "/retailer/marketplace") return "marketplace";
    if (location.pathname === "/settings") return "settings";
    return "overview";
  }, [location.pathname]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchedOrgs, setFetchedOrgs] = useState<Record<string, string>>({});
  const [fetchedNames, setFetchedNames] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [targetSupplierId, setTargetSupplierId] = useState<string | null>(null);

  // Fetch missing names (Organizations and Employees)
  useEffect(() => {
    const missingSupplierIds = orders
      .filter(o => !!o.supplierId && !(o as any).supplierName && !organizations[o.supplierId!] && !fetchedOrgs[o.supplierId!])
      .map(o => o.supplierId as string);
    
    const missingEmployeeIds = orders
      .filter(o => !!o.employeeId && !o.employeeName && !fetchedNames[o.employeeId!])
      .map(o => o.employeeId as string);

    const uniqueMissingOrgs = Array.from(new Set(missingSupplierIds)) as string[];
    const uniqueMissingEmployees = Array.from(new Set(missingEmployeeIds)) as string[];

    if (uniqueMissingOrgs.length > 0) {
      uniqueMissingOrgs.forEach((id: string) => {
        // Use a placeholder to avoid duplicate requests
        setFetchedOrgs(prev => ({ ...prev, [id]: `Supplier ${id.slice(-4).toUpperCase()}` }));
        api.get(`/auth/resolve/${id}`)
          .then(res => {
            const result = res.data.data;
            if (result && result.name) setFetchedOrgs(prev => ({ ...prev, [id]: result.name }));
          })
          .catch(err => console.error("Error fetching org:", id, err));
      });
    }

    if (uniqueMissingEmployees.length > 0) {
      uniqueMissingEmployees.forEach((id: string) => {
        setFetchedNames(prev => ({ ...prev, [id]: `Agent ${id.slice(-4).toUpperCase()}` }));
        api.get(`/auth/resolve/${id}`)
          .then(res => {
            const result = res.data.data;
            if (result && result.name) setFetchedNames(prev => ({ ...prev, [id]: result.name }));
          })
          .catch(err => console.error("Error fetching employee:", id, err));
      });
    }
  }, [orders, organizations]);

  // Compute unique suppliers for filtering
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Map<string, string>();
    orders.forEach(order => {
      const sId = order.supplierId;
      if (!sId) return;
      const sName = (order as any).supplierName || fetchedOrgs[sId] || organizations[sId]?.name || `Supplier ${sId.slice(-4).toUpperCase()}`;
      suppliers.set(sId, sName);
    });
    return Array.from(suppliers.entries()).map(([id, name]) => ({ id, name }));
  }, [orders, organizations, fetchedOrgs]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const handleViewMarketplace = (supplierId: string) => {
    setTargetSupplierId(supplierId);
    navigate("/retailer/marketplace");
  };

  useEffect(() => {
    if (!user) return;

    // We allow fetching orders even if no activeOrg is selected (personal orders)
    const retailerIds = Array.from(new Set([user.uid, activeOrg?.id].filter(Boolean) as string[]));
    
    // Fallback if no retailerIds (shouldn't happen if user exists)
    if (retailerIds.length === 0) return;

    const ordersQuery = query(
      collection(db, "orders"), 
      where("retailerId", "in", retailerIds)
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log(`[RetailerDashboard] Fetched ${snapshot.size} orders for retailers:`, retailerIds);
      const uniqueOrders = new Map<string, Order>();
      snapshot.docs.forEach(doc => {
        uniqueOrders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      });
      
      const docs = Array.from(uniqueOrders.values());
      // Sort in memory by createdAt desc
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
        const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
        return timeB - timeA;
      });
      setOrders(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "orders");
    });

    return () => unsubscribe();
  }, [user, activeOrg]);

  const generateInvoice = (order: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("TracksUp INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${order.id.toUpperCase()}`, 20, 40);
    doc.text(`Date: ${format(new Date(), 'PPpp')}`, 20, 45);
    doc.text(`Supplier: ${order.supplierName || activeOrg?.name || "Verified Partner"}`, 20, 50);
    
    doc.text("BILL TO:", 20, 60);
    doc.text(order.retailerName, 20, 65);
    doc.text(user?.email || "", 20, 70);

    const symbol = getCurrencySymbol(order.currency);

    const tableData = order.items?.map((item: any) => [
      item.name,
      item.quantity,
      `${symbol}${item.price.toFixed(2)}`,
      `${symbol}${(item.quantity * item.price).toFixed(2)}`
    ]) || [];

    autoTable(doc, {
      startY: 80,
      head: [["Product", "Qty", "Price", "Total"]],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: ${formatCurrency(order.totalAmount, order.currency)}`, 140, finalY);

    doc.setFontSize(8);
    doc.text("Thank you for choosing TracksUp!", 105, finalY + 20, { align: "center" });
    
    doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "assigned", "out_for_delivery", "delivered"];
    return steps.indexOf(status);
  };

  const stats = {
    totalOrders: orders.length,
    activeDeliveries: orders.filter(o => o.status !== 'delivered').length,
    totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingPayments: orders.filter(o => o.payment_status !== 'paid').reduce((sum, o) => sum + o.totalAmount, 0),
    paidPayments: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0)
  };

  return (
    <DashboardLayout
      title="Terminal Dashboard"
      subtitle={activeOrg?.name}
    >
      <div className="space-y-8">
        {activeTab === "overview" && (
          <div className="space-y-4 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2 p-4 md:p-6">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Aggregate Orders</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black italic tracking-tighter">{stats.totalOrders}</CardTitle>
                </CardHeader>
                <div className="px-4 md:px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2 p-4 md:p-6">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active Transit</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black italic tracking-tighter">{stats.activeDeliveries}</CardTitle>
                </CardHeader>
                <div className="px-4 md:px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stats.activeDeliveries / stats.totalOrders) * 100 || 0}%` }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2 p-4 md:p-6">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Gross Expenditure</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black italic tracking-tighter">{formatCurrency(stats.totalSpent, preferredCurrency)}</CardTitle>
                </CardHeader>
                <div className="px-4 md:px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-rose-50 overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2 p-4 md:p-6">
                  <CardDescription className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Pending Settlement</CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-black italic tracking-tighter text-rose-600">{formatCurrency(stats.pendingPayments, preferredCurrency)}</CardTitle>
                </CardHeader>
                <div className="px-4 md:px-6 pb-4">
                  <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: `${(stats.pendingPayments / stats.totalSpent) * 100 || 0}%` }} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                <CardHeader className="border-b border-zinc-50 pb-6">
                  <CardTitle className="text-lg font-black uppercase italic tracking-tight">Recent Arrivals</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Last 5 units in registry</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="divide-y divide-zinc-50">
                    {orders.slice(0, 5).map(order => (
                      <div 
                        key={`recent-order-${order.id}`} 
                        className="flex items-center justify-between p-6 hover:bg-zinc-50 cursor-pointer transition-all group"
                        onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:rotate-6 transition-transform">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 uppercase italic">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, HH:mm') : 'Pending...'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <p className="text-sm font-black italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</p>
                           <ChevronRight className="h-4 w-4 text-zinc-200 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center justify-center opacity-20">
                         <Package className="h-12 w-12 mb-4" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Registry empty</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-zinc-900 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase italic tracking-tight">Logistics Overview</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live operational vector tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-zinc-800 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 shadow-inner">
                    <Truck className="h-12 w-12 text-zinc-600 mb-4 animate-bounce" />
                    <p className="text-xl font-black italic tracking-tighter">{stats.activeDeliveries}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-2">Active Shipments</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {(activeTab === "orders" || activeTab === "tracking") && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Active Transit</h3>
              <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200 overflow-x-auto no-scrollbar">
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[160px] h-9 border-none bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    <SelectValue placeholder="Supplier Filter">
                      {supplierFilter === "all" ? "Every Supplier" : (uniqueSuppliers.find(s => s.id === supplierFilter)?.name || fetchedOrgs[supplierFilter] || "Supplier Filter")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Every Supplier</SelectItem>
                    {uniqueSuppliers.map(s => (
                      <SelectItem key={`filter-active-${s.id}`} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {orders
                .filter(o => o.status !== 'delivered')
                .filter(o => supplierFilter === 'all' || o.supplierId === supplierFilter)
                .map(order => {
                const currentStep = getStatusStep(order.status);
                return (
                  <Card key={`transit-order-${order.id}`} className="overflow-hidden border-none shadow-xl rounded-3xl bg-white border-l-8 border-l-zinc-900 group">
                    <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-zinc-50">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg overflow-hidden relative">
                          <Truck className="h-7 w-7" />
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-black uppercase italic tracking-tight">
                            { (order as any).supplierName || organizations[order.supplierId || ""]?.name || fetchedOrgs[order.supplierId || ""] || `Order #${order.id.slice(-8).toUpperCase()}` }
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                            { (order as any).supplierName || organizations[order.supplierId || ""]?.name || fetchedOrgs[order.supplierId || ""] ? `Manifest #${order.id.slice(-8).toUpperCase()}` : `Target Window: ${order.deliveryDate}` }
                          </CardDescription>
                          { ((order as any).supplierName || organizations[order.supplierId || ""]?.name || fetchedOrgs[order.supplierId || ""]) && (
                             <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Target Window: {order.deliveryDate}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-11 border-zinc-100 px-6" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> Manifest
                      </Button>
                    </CardHeader>
                    <CardContent className="p-12 bg-zinc-50/20">
                      <div className="relative flex justify-between">
                        <div className="absolute top-6 left-12 right-12 h-1 bg-zinc-100 -z-0 rounded-full" />
                        <div className="absolute top-6 left-12 right-12 h-1 bg-zinc-900 transition-all duration-700 ease-in-out -z-0 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
                             style={{ width: `${(currentStep / 3) * 100}%` }} />

                        {[
                          { icon: Clock, label: "Logged" },
                          { icon: CheckCircle, label: "Assigned" },
                          { icon: Truck, label: "In Transit" },
                          { icon: Package, label: "Finalized" }
                        ].map((step, idx) => {
                          const isActive = currentStep >= idx;
                          const Icon = step.icon;
                          const isCurrent = currentStep === idx;
                          return (
                            <div key={`tracking-step-${idx}`} className="flex flex-col items-center">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border-4 shadow-sm transition-all duration-500 translate-z-0 ${
                                isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-white bg-zinc-50 text-zinc-300"
                              } ${isCurrent ? 'scale-125 shadow-xl ring-8 ring-zinc-900/5' : ''}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <p className={`mt-4 text-[10px] font-black uppercase tracking-widest ${isActive ? "text-zinc-900" : "text-zinc-300"}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-zinc-900/5 backdrop-blur-sm border-t p-4 flex justify-between items-center px-10">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center text-[10px] font-black uppercase italic">
                          {order.employeeId?.charAt(0) || "A"}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {order.employeeName || fetchedNames[order.employeeId || ""] || (order.employeeId ? `Agent: ${order.employeeId.slice(-8).toUpperCase()}` : 'Buffer: Assigning Agent...')}
                        </span>
                      </div>
                      <Badge className={`rounded-lg font-black uppercase text-[10px] h-7 italic tracking-widest ${order.status === 'out_for_delivery' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-900'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </CardFooter>
                  </Card>
                );
              })}
              {orders.filter(o => o.status !== 'delivered').length === 0 && (
                <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 shadow-inner">
                  <Package className="h-16 w-16 text-zinc-100 mx-auto mb-6" />
                  <p className="text-zinc-400 font-black uppercase tracking-widest text-xs italic">No active transit tasks in registry</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === "history" || activeTab === "invites") && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Archive Registry</h3>
              <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200 overflow-x-auto no-scrollbar">
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[160px] h-9 border-none bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    <SelectValue placeholder="Supplier Filter">
                      {supplierFilter === "all" ? "Every Supplier" : (uniqueSuppliers.find(s => s.id === supplierFilter)?.name || fetchedOrgs[supplierFilter] || "Supplier Filter")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Every Supplier</SelectItem>
                    {uniqueSuppliers.map(s => (
                      <SelectItem key={`filter-history-${s.id}`} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-[140px] h-9 border-none bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest">
                    <SelectValue placeholder="System Filter" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Global Ledger</SelectItem>
                    <SelectItem value="paid">Finalized</SelectItem>
                    <SelectItem value="unpaid">Awaiting</SelectItem>
                    <SelectItem value="credit">Credit Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {orders
                .filter(o => o.status === 'delivered')
                .filter(o => historyFilter === 'all' || o.payment_status === historyFilter)
                .filter(o => supplierFilter === 'all' || o.supplierId === supplierFilter)
                .map(order => (
                  <Card key={`history-order-${order.id}`} className="hover:border-zinc-900 transition-all cursor-pointer group bg-white rounded-3xl border-none shadow-sm hover:shadow-xl" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900 group-hover:text-primary transition-colors uppercase italic">
                            { (order as any).supplierName || organizations[order.supplierId || ""]?.name || fetchedOrgs[order.supplierId || ""] || `Order #${order.id.slice(-8).toUpperCase()}` }
                          </p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            { (order as any).supplierName || organizations[order.supplierId || ""]?.name || fetchedOrgs[order.supplierId || ""] ? `Manifest #${order.id.slice(-8).toUpperCase()} • ` : "" }
                            {order.delivered_at ? safeFormat(order.delivered_at, 'PPP', 'Delivered') : 'Delivered'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Settlement</p>
                          {getPaymentBadge(order.payment_status)}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Total Capital</p>
                          <p className="text-lg font-black italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-200 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {activeTab === "outstanding" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-emerald-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-black uppercase opacity-90 mb-4 tracking-[0.3em] font-sans">Resolved Capital</p>
                <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(stats.paidPayments, preferredCurrency)}</h3>
                <div className="mt-8 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white/60" style={{ width: `${(stats.paidPayments / stats.totalSpent) * 100}%` }} />
                </div>
              </div>
              <div className="bg-rose-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-black uppercase opacity-90 mb-4 tracking-[0.3em] font-sans">Outstanding Settlement</p>
                <h3 className="text-5xl font-black italic tracking-tighter">{formatCurrency(stats.pendingPayments, preferredCurrency)}</h3>
                <div className="mt-8 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white/60" style={{ width: `${(stats.pendingPayments / stats.totalSpent) * 100}%` }} />
                </div>
              </div>
            </div>

            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-4 md:p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl font-black uppercase italic tracking-tight">Audit Ledger</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Master organizational balance sheet</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-[160px] h-9 border-none bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      <SelectValue placeholder="Supplier Filter">
                        {supplierFilter === "all" ? "Every Supplier" : (uniqueSuppliers.find(s => s.id === supplierFilter)?.name || fetchedOrgs[supplierFilter] || "Supplier Filter")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Every Supplier</SelectItem>
                      {uniqueSuppliers.map(s => (
                        <SelectItem key={`filter-ledger-${s.id}`} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400 px-4 md:px-8 h-14">Order ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400 px-4 md:px-8 h-14">Entry Date</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400 px-4 md:px-8 h-14 text-center">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-400 px-4 md:px-8 h-14 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders
                      .filter(o => supplierFilter === 'all' || o.supplierId === supplierFilter)
                      .map(order => (
                      <TableRow key={`ledger-order-${order.id}`} className="hover:bg-zinc-50 transition-colors">
                        <TableCell className="px-4 md:px-8 py-5">
                           <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-1 rounded">#{order.id.slice(-8).toUpperCase()}</span>
                        </TableCell>
                        <TableCell className="px-4 md:px-8 py-5 font-bold text-zinc-600 text-xs uppercase italic whitespace-nowrap">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PP') : '...'}</TableCell>
                        <TableCell className="px-4 md:px-8 py-5 text-center">{getPaymentBadge(order.payment_status)}</TableCell>
                        <TableCell className="px-4 md:px-8 py-5 text-right font-black italic tracking-tighter text-sm whitespace-nowrap">${order.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight">Tax Documentation</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Download compliance-ready logistics receipts</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-[160px] h-9 border-none bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      <SelectValue placeholder="Supplier Filter">
                        {supplierFilter === "all" ? "Every Supplier" : (uniqueSuppliers.find(s => s.id === supplierFilter)?.name || fetchedOrgs[supplierFilter] || "Supplier Filter")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Every Supplier</SelectItem>
                      {uniqueSuppliers.map(s => (
                        <SelectItem key={`filter-invoices-${s.id}`} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-50">
                  {orders
                    .filter(o => supplierFilter === 'all' || o.supplierId === supplierFilter)
                    .map(order => (
                    <div key={`invoice-order-${order.id}`} className="flex items-center justify-between p-8 px-10 hover:bg-zinc-50 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 text-rose-600 bg-rose-50 flex items-center justify-center rounded-2xl group-hover:rotate-3 transition-transform shadow-sm">
                          <FileText className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase italic tracking-tight">INV-{order.id.slice(0, 10).toUpperCase()}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Billed: {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPP') : '...'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black italic tracking-tighter hidden sm:block mr-4">${order.totalAmount.toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => { setSelectedInvoiceOrder(order); setIsInvoiceOpen(true); }}>
                          <Eye className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => generateInvoice(order)}>
                          <Download className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "suppliers" && <RetailerSuppliers onViewMarketplace={handleViewMarketplace} />}

        {activeTab === "marketplace" && <RetailerMarketplace initialSupplierId={targetSupplierId} />}

        {activeTab === "settings" && <SettingsView />}

        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            isOpen={isDetailOpen} 
            onOpenChange={setIsDetailOpen} 
            onGenerateInvoice={generateInvoice}
            fetchedOrgs={fetchedOrgs}
            organizations={organizations}
          />
        )}

        {selectedInvoiceOrder && (
          <InvoicePreviewModal
            order={selectedInvoiceOrder}
            orgName={activeOrg?.name}
            isOpen={isInvoiceOpen}
            onOpenChange={setIsInvoiceOpen}
            onDownload={generateInvoice}
            fetchedOrgs={fetchedOrgs}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
