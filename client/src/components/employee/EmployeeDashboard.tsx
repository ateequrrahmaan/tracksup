import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, CheckCircle, Package, LogOut, MapPin, Store, Settings, Calculator, AlertCircle, Phone, Clock, FileText, Filter, Calendar as CalendarIcon, ChevronRight, Building } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryConfirmationModal } from "./DeliveryConfirmationModal";
import { DashboardLayout } from "../shared/DashboardLayout";

import { Order } from "@/types";
import { format } from "date-fns";

interface OrderCardProps {
  order: Order;
  onConfirm: () => void;
  onStart: () => void | Promise<void>;
  onView: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onConfirm, onStart, onView }) => (
  <Card className="overflow-hidden shadow-sm border-none bg-white hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer" onClick={onView}>
    <CardHeader className="pb-3 border-b border-zinc-50">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center text-primary">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-black truncate max-w-[150px]">{order.retailerName}</CardTitle>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">ID: #{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <Badge variant={(order.status === "out_for_delivery" ? "warning" : "default") as any} className="text-[10px]">
          {order.status.replace(/_/g, ' ')}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="py-4">
      <div className="flex items-center text-xs text-zinc-500 mb-3 bg-zinc-50 p-2 rounded-md">
        <MapPin className="h-3 w-3 mr-1 text-zinc-400" />
        <span className="truncate">{order.deliveryDate || 'No date set'}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
          <span>Items: {order.items?.length || 0}</span>
          <span className="text-primary font-black text-lg">${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="bg-zinc-50/50 p-3 flex gap-2">
      {order.status === "assigned" ? (
        <Button className="w-full text-xs h-10 font-bold tracking-tight shadow-sm" onClick={(e) => { e.stopPropagation(); onStart(); }}>
          <Truck className="mr-2 h-4 w-4" /> Start Delivery
        </Button>
      ) : (
        <Button 
          className="w-full text-xs h-10 bg-emerald-600 hover:bg-emerald-700 font-bold tracking-tight shadow-sm" 
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
        >
          <CheckCircle className="mr-2 h-4 w-4" /> Confirm Delivery
        </Button>
      )}
    </CardFooter>
  </Card>
);

const getPaymentBadge = (status?: string) => {
  switch (status) {
    case "paid": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Paid</Badge>;
    case "unpaid": return <Badge className="bg-red-100 text-red-700 border-red-200">Unpaid</Badge>;
    case "credit": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Credit</Badge>;
    default: return <Badge variant="outline">N/A</Badge>;
  }
};

interface ManifestModalProps {
  order: Order | null;
  onClose: () => void;
  onExecuteHandover: (order: Order) => void;
}

const ManifestModal: React.FC<ManifestModalProps> = ({ order, onClose, onExecuteHandover }) => {
  if (!order) return null;
  
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-zinc-900 p-8 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex gap-2">
                <Badge variant={(order.status === 'delivered' ? 'success' : 'default') as any} className="rounded-lg h-7 font-black uppercase text-[10px] italic">
                  {order.status.replace(/_/g, ' ')}
                </Badge>
                {getPaymentBadge(order.payment_status)}
              </div>
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tight leading-none mb-1">
              Manifest #{order.id.slice(-8).toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">
              Consignee: {order.retailerName}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-8 space-y-8 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">Operational Log</p>
               <div className="space-y-4">
                  <TimelineItem icon={<Clock />} label="Request Placed" date={order.createdAt} active />
                  <TimelineItem icon={<Truck />} label="Transit Start" date={order.status !== 'pending' && order.status !== 'assigned' ? order.updatedAt : null} active={order.status !== 'pending' && order.status !== 'assigned'} />
                  <TimelineItem icon={<CheckCircle />} label="Final Handover" date={order.delivered_at} active={order.status === 'delivered'} />
               </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">Payload Details</p>
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-inner">
                {order.items.map((item, idx) => (
                  <div key={`manifest-item-${idx}`} className="flex justify-between items-center">
                     <div className="flex flex-col">
                       <span className="text-zinc-900 font-black uppercase italic text-xs tracking-tight">{item.name}</span>
                       <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-black text-zinc-900 italic text-sm tracking-tight">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="bg-zinc-200 opacity-50" />
                <div className="pt-2 flex justify-between font-black text-zinc-900 italic text-lg tracking-tighter">
                   <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mt-1">Aggregate Val</span>
                   <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {order.amount_collected !== undefined && (
                 <div className="bg-emerald-900 p-4 rounded-2xl flex justify-between items-center text-white shadow-lg">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Capital Resolved</span>
                    <span className="font-black text-2xl italic tracking-tighter">${order.amount_collected.toFixed(2)}</span>
                 </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-8 pt-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="h-12 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest">Close Manifest</Button>
          {order.status !== 'delivered' && (
             <Button className="h-12 rounded-full px-8 font-black uppercase tracking-widest shadow-lg shadow-zinc-200" onClick={() => onExecuteHandover(order)}>
               Execute Handover
             </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EmployeeDashboard = () => {
  const { user, activeOrg, memberships, switchOrg } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDetailOrder, setViewDetailOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  useEffect(() => {
    if (!user || !activeOrg) return;

    const ordersQuery = query(
      collection(db, "orders"), 
      where("organizationId", "==", activeOrg.id),
      where("employeeId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const uniqueOrders = new Map<string, Order>();
      snapshot.docs.forEach(doc => {
        uniqueOrders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      });
      const docs = Array.from(uniqueOrders.values());
      setOrders(docs);
      if (docs.length > 0) {
        toast.info(`Found ${docs.length} assigned orders`);
      }
    }, (error) => {
      console.error("Orders listener error:", error);
      toast.error("Failed to load orders. Please check your connection.");
      
      // Specifically handle permission denied / indexing issues
      if (error.code === 'permission-denied') {
        console.warn("Permission denied for orders. Check security rules.");
      }
    });

    return () => unsubscribe();
  }, [user, activeOrg]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const markAsPaid = async (order: Order) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        payment_status: "paid",
        amount_collected: order.totalAmount,
        updatedAt: serverTimestamp()
      });
      toast.success("Marked as paid");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleConfirmDelivery = async (data: { paymentStatus: string }) => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        status: "delivered",
        payment_status: data.paymentStatus,
        amount_collected: selectedOrder.totalAmount,
        delivered_at: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      
      fetch(`/api/orders/${selectedOrder.id}/deliver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, amountCollected: selectedOrder.totalAmount })
      }).catch(console.error);

      toast.success("Delivery confirmed!");
      setIsModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      toast.error("Failed to confirm delivery");
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todays = orders.filter(o => o.deliveryDate === today);
    const deliveredToday = todays.filter(o => o.status === 'delivered');
    
    return {
      deliveredToday: deliveredToday.length,
      collectedToday: deliveredToday.reduce((sum, o) => sum + (o.amount_collected || 0), 0),
      pendingCollection: orders.filter(o => o.payment_status !== 'paid').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
      return matchStatus && matchPayment;
    });
  }, [orders, statusFilter, paymentFilter]);

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDeliveries = filteredOrders.filter(o => o.status !== "delivered");
  const todaysDeliveries = activeDeliveries.filter(o => o.deliveryDate === todayStr);
  const pendingCollections = orders.filter(o => o.status === "delivered" && (o.payment_status === "unpaid" || o.payment_status === "credit"));

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={activeTab === 'overview' ? "Operations Room" : "Transit Log"}
      subtitle={activeOrg?.name}
    >
      <div className="space-y-8">
        {/* Performance Cards - always visible or maybe only in overview? User wants separate features per role. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-white border-zinc-200 shadow-sm p-6 rounded-3xl group hover:scale-[1.02] transition-all">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Units Delivered</p>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-zinc-900 italic tracking-tighter">{stats.deliveredToday}</div>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-4 uppercase tracking-tight italic">Temporal window: Today</p>
          </Card>
          <Card className="bg-white border-zinc-200 shadow-sm p-6 rounded-3xl group hover:scale-[1.02] transition-all">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Capital Collected</p>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-emerald-600 italic tracking-tighter">${stats.collectedToday.toFixed(0)}</div>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-4 uppercase tracking-tight italic">Success rate: Nominal</p>
          </Card>
          <Card className="bg-white border-zinc-200 shadow-sm p-6 rounded-3xl group hover:scale-[1.02] transition-all">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Risk Assessment</p>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-rose-500 italic tracking-tighter">${stats.pendingCollection.toFixed(0)}</div>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-4 uppercase tracking-tight italic">Outstanding collection</p>
          </Card>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {todaysDeliveries.map((order) => (
                  <OrderCard 
                    key={`today-${order.id}`} 
                    order={order} 
                    onConfirm={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    onStart={() => updateStatus(order.id, "out_for_delivery")}
                    onView={() => setViewDetailOrder(order)}
                  />
               ))}
             </div>
             {todaysDeliveries.length === 0 && (
               <div className="space-y-6">
                 <EmptyState message="System buffer empty for today" />
                 {activeDeliveries.length > 0 && (
                   <p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                     Found {activeDeliveries.length} active nodes in general queue.
                   </p>
                 )}
               </div>
             )}
          </div>
        )}

        {activeTab === "collections" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCollections.map((order) => (
                  <Card key={`collection-${order.id}`} className="p-6 rounded-3xl shadow-xl border-l-4 border-l-rose-500 bg-white group hover:scale-[1.01] transition-all cursor-pointer" onClick={() => setViewDetailOrder(order)}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <h4 className="font-black text-zinc-900 uppercase italic leading-none">{order.retailerName}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Node ID: #{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-500 text-2xl italic tracking-tighter leading-none">${order.totalAmount.toFixed(2)}</p>
                        <div className="mt-2">{getPaymentBadge(order.payment_status)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" className="flex-1 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100" onClick={(e) => { e.stopPropagation(); markAsPaid(order); }}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Finalize
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest border-zinc-100" onClick={(e) => { e.stopPropagation(); window.open(`tel:${activeOrg?.phone || ''}`); }}>
                        <Phone className="h-4 w-4 mr-2 text-zinc-400" /> Comm
                      </Button>
                    </div>
                  </Card>
               ))}
             </div>
             {pendingCollections.length === 0 && (
               <EmptyState message="All accounts balanced" icon={<CheckCircle className="h-10 w-10 text-emerald-500 opacity-20" />} />
             )}
          </div>
        )}

        {activeTab === "deliveries" && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm w-fit">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="w-64 h-10 rounded-xl border-none bg-zinc-50 font-bold text-[10px] uppercase tracking-widest">
                   <Filter className="h-3.5 w-3.5 mr-2 text-zinc-400" />
                   <SelectValue placeholder="System Filter" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl">
                   <SelectItem value="all">Global Queue</SelectItem>
                   <SelectItem value="assigned">Awaiting Transit</SelectItem>
                   <SelectItem value="out_for_delivery">In Transit</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDeliveries.map((order) => (
                <OrderCard 
                  key={`transit-log-${order.id}`} 
                  order={order} 
                  onConfirm={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                  onStart={() => updateStatus(order.id, "out_for_delivery")}
                  onView={() => setViewDetailOrder(order)}
                />
              ))}
            </div>
            {activeDeliveries.length === 0 && (
              <EmptyState message="Registry empty" icon={<Truck className="h-10 w-10 opacity-20" />} />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm w-fit mb-6">
               <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                 <SelectTrigger className="w-64 h-10 rounded-xl border-none bg-zinc-50 font-bold text-[10px] uppercase tracking-widest">
                   <Filter className="h-3.5 w-3.5 mr-2 text-zinc-400" />
                   <SelectValue placeholder="Financial Filter" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl">
                   <SelectItem value="all">Global Ledger</SelectItem>
                   <SelectItem value="paid">Finalized</SelectItem>
                   <SelectItem value="unpaid">Awaiting</SelectItem>
                   <SelectItem value="credit">Credit Balance</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.filter(o => o.status === 'delivered').map((order) => (
                <Card key={`history-${order.id}`} className="p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white group border-none" onClick={() => setViewDetailOrder(order)}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900 uppercase italic">{order.retailerName}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">{order.delivered_at ? format(new Date(order.delivered_at), 'MMM d, HH:mm') : '...'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-zinc-900 italic tracking-tighter">${order.totalAmount.toFixed(2)}</p>
                      {getPaymentBadge(order.payment_status)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {filteredOrders.filter(o => o.status === 'delivered').length === 0 && (
              <EmptyState message="Archive registry empty" />
            )}
          </div>
        )}

        <DeliveryConfirmationModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleConfirmDelivery}
        />

        {/* Order Detail Modal */}
        <ManifestModal 
          order={viewDetailOrder} 
          onClose={() => setViewDetailOrder(null)} 
          onExecuteHandover={(order) => {
            setViewDetailOrder(null);
            setSelectedOrder(order);
            setIsModalOpen(true);
          }}
        />
      </div>
    </DashboardLayout>
  );

};

const TimelineItem = ({ icon, label, date, active }: { icon: React.ReactNode; label: string; date?: any; active?: boolean }) => (
  <div className={`flex items-start gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
     <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 bg-white text-zinc-400'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
     </div>
     <div className="flex-1">
        <p className={`text-xs font-bold uppercase tracking-tight ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>{label}</p>
        <p className="text-[10px] text-zinc-500">
          {date ? (typeof date === 'string' ? date : format(date.toDate(), 'PP p')) : 'Waiting...'}
        </p>
     </div>
  </div>
);

const EmptyState = ({ message, icon }: { message: string; icon?: React.ReactNode }) => (
  <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
    <div className="flex justify-center mb-4 text-zinc-200">
      {icon || <Package className="h-10 w-10" />}
    </div>
    <p className="text-sm font-bold text-zinc-500 uppercase tracking-tight">{message}</p>
  </div>
);
