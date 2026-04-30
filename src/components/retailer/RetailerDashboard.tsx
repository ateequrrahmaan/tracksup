import React, { useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/src/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, LogOut, Download, Store, Settings, LayoutDashboard, History, CreditCard, FileText, Eye, ChevronRight } from "lucide-react";
import { auth } from "@/src/lib/firebase";
import { signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order, SystemUser } from "@/src/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardLayout } from "../shared/DashboardLayout";

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
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onOpenChange, onGenerateInvoice }) => {
  if (!order) return null;
  
  const steps = ["pending", "assigned", "out_for_delivery", "delivered"];
  const currentStep = steps.indexOf(order.status);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start pr-8">
            <div>
              <DialogTitle className="text-xl">Order #{order.id.slice(-6).toUpperCase()}</DialogTitle>
              <DialogDescription>
                Placed on {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPPp') : 'Processing...'}
              </DialogDescription>
            </div>
            <Badge variant={order.status === "delivered" ? "success" : "default"} as any>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>

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
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Order Breakdown</h4>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={`modal-item-${idx}`} className="flex justify-between text-sm">
                  <span className="text-zinc-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-bold text-zinc-900">
                <span>Total Amount</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Payment Info</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Status:</span>
                  {getPaymentBadge(order.payment_status)}
                </div>
                <p className="text-sm text-zinc-600">Collected: ${order.amount_collected?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Delivery Info</p>
              <p className="text-sm font-semibold">Date: {order.delivered_at ? format(new Date(order.delivered_at), 'PPP') : 'Not yet'}</p>
              <p className="text-sm text-zinc-600">Agent ID: {order.employeeId?.slice(-6).toUpperCase() || 'Assigned'}</p>
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

export const RetailerDashboard = () => {
  const { user, memberships, activeOrg, switchOrg } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    if (!user || !activeOrg) return;

    const ordersQuery = query(
      collection(db, "orders"), 
      where("organizationId", "==", activeOrg.id),
      where("retailerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const uniqueOrders = new Map<string, Order>();
      snapshot.docs.forEach(doc => {
        uniqueOrders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      });
      setOrders(Array.from(uniqueOrders.values()));
    }, (error) => {
      console.error("Orders listener error:", error);
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
    doc.text(`Organization: ${activeOrg?.name}`, 20, 50);
    
    doc.text("BILL TO:", 20, 60);
    doc.text(order.retailerName, 20, 65);
    doc.text(user?.email || "", 20, 70);

    const tableData = order.items?.map((item: any) => [
      item.name,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`
    ]) || [];

    autoTable(doc, {
      startY: 80,
      head: [["Product", "Qty", "Price", "Total"]],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: $${order.totalAmount.toFixed(2)}`, 140, finalY);

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
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="Terminal Dashboard"
      subtitle={activeOrg?.name}
    >
      <div className="space-y-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aggregate Orders</CardDescription>
                  <CardTitle className="text-3xl font-black italic tracking-tighter">{stats.totalOrders}</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Active Transit</CardDescription>
                  <CardTitle className="text-3xl font-black italic tracking-tighter">{stats.activeDeliveries}</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stats.activeDeliveries / stats.totalOrders) * 100 || 0}%` }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Gross Expenditure</CardDescription>
                  <CardTitle className="text-3xl font-black italic tracking-tighter">${stats.totalSpent.toFixed(0)}</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4">
                  <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm bg-rose-50 overflow-hidden rounded-3xl group hover:scale-[1.02] transition-all">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Pending Settlement</CardDescription>
                  <CardTitle className="text-3xl font-black italic tracking-tighter text-rose-600">${stats.pendingPayments.toFixed(0)}</CardTitle>
                </CardHeader>
                <div className="px-6 pb-4">
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
                           <p className="text-sm font-black italic tracking-tighter">${order.totalAmount.toFixed(2)}</p>
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

        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {orders.filter(o => o.status !== 'delivered').map(order => {
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
                          <CardTitle className="text-xl font-black uppercase italic tracking-tight">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Target Window: {order.deliveryDate}</CardDescription>
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
                          {order.employeeId ? `Agent ID: ${order.employeeId.slice(-8).toUpperCase()}` : 'Buffer: Assigning Agent...'}
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

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Archive Registry</h3>
              <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
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
                .map(order => (
                  <Card key={`history-order-${order.id}`} className="hover:border-zinc-900 transition-all cursor-pointer group bg-white rounded-3xl border-none shadow-sm hover:shadow-xl" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900 group-hover:text-primary transition-colors uppercase italic">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{order.delivered_at ? format(new Date(order.delivered_at), 'PPP') : 'Delivered'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Settlement</p>
                          {getPaymentBadge(order.payment_status)}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Total Capital</p>
                          <p className="text-lg font-black italic tracking-tighter">${order.totalAmount.toFixed(2)}</p>
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
                <p className="text-[10px] font-black uppercase opacity-60 mb-4 tracking-[0.3em] font-sans">Resolved Capital</p>
                <h3 className="text-5xl font-black italic tracking-tighter">${stats.paidPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <div className="mt-8 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white/60" style={{ width: `${(stats.paidPayments / stats.totalSpent) * 100}%` }} />
                </div>
              </div>
              <div className="bg-rose-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-black uppercase opacity-60 mb-4 tracking-[0.3em] font-sans">Outstanding Settlement</p>
                <h3 className="text-5xl font-black italic tracking-tighter">${stats.pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <div className="mt-8 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white/60" style={{ width: `${(stats.pendingPayments / stats.totalSpent) * 100}%` }} />
                </div>
              </div>
            </div>

            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50">
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Audit Ledger</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Master organizational balance sheet</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 px-8 h-14">Order ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 px-8 h-14">Entry Date</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 px-8 h-14 text-center">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 px-8 h-14 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={`ledger-order-${order.id}`} className="hover:bg-zinc-50 transition-colors">
                        <TableCell className="px-8 py-5">
                           <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-1 rounded">#{order.id.slice(-8).toUpperCase()}</span>
                        </TableCell>
                        <TableCell className="px-8 py-5 font-bold text-zinc-600 text-xs uppercase uppercase italic">{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PP') : '...'}</TableCell>
                        <TableCell className="px-8 py-5 text-center">{getPaymentBadge(order.payment_status)}</TableCell>
                        <TableCell className="px-8 py-5 text-right font-black italic tracking-tighter text-sm">${order.totalAmount.toFixed(2)}</TableCell>
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
              <CardHeader className="p-8 border-b border-zinc-50">
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Tax Documentation</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Download compliance-ready logistics receipts</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-50">
                  {orders.map(order => (
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
                      <div className="flex items-center gap-8">
                        <p className="text-lg font-black italic tracking-tighter hidden sm:block">${order.totalAmount.toFixed(2)}</p>
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

        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            isOpen={isDetailOpen} 
            onOpenChange={setIsDetailOpen} 
            onGenerateInvoice={generateInvoice}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
