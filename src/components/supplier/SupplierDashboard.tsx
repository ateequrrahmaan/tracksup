import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, setDoc, deleteDoc, doc, serverTimestamp, getDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/src/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "../shared/DashboardLayout";
import { Order, SystemUser, Invite } from "@/src/types";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";
import { NewOrderDialog } from "./components/NewOrderDialog";
import { InviteDialog } from "./components/InviteDialog";
import { SupplierOverview } from "./components/SupplierOverview";
import { SupplierOrders } from "./components/SupplierOrders";
import { SupplierOutstanding } from "./components/SupplierOutstanding";
import { SupplierInsights } from "./components/SupplierInsights";
import { SupplierNetwork } from "./components/SupplierNetwork";
import { SupplierInvites } from "./components/SupplierInvites";

export const SupplierDashboard = () => {
  const { user, activeOrg } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<SystemUser[]>([]);
  const [retailers, setRetailers] = useState<SystemUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  
  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Data Fetching
  useEffect(() => {
    if (!user || !activeOrg) return;

    const ordersQuery = query(collection(db, "orders"), where("organizationId", "==", activeOrg.id));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const uniqueOrders = new Map<string, Order>();
      snapshot.docs.forEach(doc => {
        uniqueOrders.set(doc.id, { id: doc.id, ...doc.data() } as Order);
      });
      setOrders(Array.from(uniqueOrders.values()));
    }, (error) => {
       console.error("Orders listener error:", error);
       toast.error("Security sync failed. Check permissions.");
    });

    const memsQuery = query(collection(db, "memberships"), where("organizationId", "==", activeOrg.id));
    const unsubscribeMems = onSnapshot(memsQuery, async (snapshot) => {
      const emps: SystemUser[] = [];
      const rets: SystemUser[] = [];
      
      for (const memDoc of snapshot.docs) {
        const mem = memDoc.data();
        const userSnap = await getDoc(doc(db, "users", mem.userId));
        if (userSnap.exists()) {
          const userData = { uid: userSnap.id, ...userSnap.data() } as SystemUser;
          if (mem.role === "employee" && !emps.find(e => e.uid === userData.uid)) emps.push(userData);
          if (mem.role === "retailer" && !rets.find(r => r.uid === userData.uid)) rets.push(userData);
        }
      }
      setEmployees(emps);
      setRetailers(rets);
    });

    const invitesQuery = query(collection(db, "invites"), where("organizationId", "==", activeOrg.id));
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      const uniqueInvites = new Map<string, Invite>();
      snapshot.docs.forEach(d => {
        uniqueInvites.set(d.id, { id: d.id, ...d.data() } as Invite);
      });
      setInvites(Array.from(uniqueInvites.values()));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMems();
      unsubscribeInvites();
    };
  }, [user, activeOrg]);

  // Derived Stats
  const stats = useMemo(() => {
    const revenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const collected = orders.reduce((acc, curr) => acc + (curr.amount_collected || 0), 0);
    
    // Top Retailers
    const retailerMap = new Map<string, { name: string, revenue: number }>();
    orders.forEach(o => {
      const current = retailerMap.get(o.retailerId) || { name: o.retailerName, revenue: 0 };
      retailerMap.set(o.retailerId, { ...current, revenue: current.revenue + (o.totalAmount || 0) });
    });
    const topRetailers = Array.from(retailerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Employee Performance
    const employeeMap = new Map<string, { name: string, deliveries: number, collected: number }>();
    orders.forEach(o => {
      if (!o.employeeId) return;
      const empName = employees.find(e => e.uid === o.employeeId)?.name || "Agent";
      const current = employeeMap.get(o.employeeId) || { name: empName, deliveries: 0, collected: 0 };
      employeeMap.set(o.employeeId, {
        ...current,
        deliveries: current.deliveries + (o.status === 'delivered' ? 1 : 0),
        collected: current.collected + (o.amount_collected || 0)
      });
    });
    const employeePerformance = Array.from(employeeMap.values()).sort((a, b) => b.collected - a.collected);

    return {
      totalOrders: orders.length,
      totalRevenue: revenue,
      totalCollected: collected,
      outstandingAmount: revenue - collected,
      paymentBreakdown: {
        paid: orders.filter(o => o.payment_status === "paid").length,
        unpaid: orders.filter(o => !o.payment_status || o.payment_status === "unpaid").length,
        credit: orders.filter(o => o.payment_status === "credit").length
      },
      topRetailers,
      employeePerformance
    };
  }, [orders, employees]);

  // Handlers
  const handleCreateOrder = async (data: any) => {
    if (!activeOrg || !user) return;
    try {
      await addDoc(collection(db, "orders"), {
        ...data,
        organizationId: activeOrg.id,
        supplierId: user.uid,
        retailerName: retailers.find(r => r.uid === data.retailerId)?.name || "Unknown Shop",
        status: data.employeeId ? "assigned" : "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsNewOrderOpen(false);
      toast.success("Manifest active - Logistics vector initialized.");
    } catch (error) {
      toast.error("Signal failure. Manifest rejected.");
    }
  };

  const handleInvite = async (e: any) => {
    e.preventDefault();
    if (!activeOrg || !user) return;

    const formData = new FormData(e.target);
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    try {
      await setDoc(doc(db, "invites", token), {
        organizationId: activeOrg.id,
        organizationName: activeOrg.name,
        email,
        role,
        token,
        status: "pending",
        expiresAt: Timestamp.fromDate(expiry),
        invitedBy: user.uid,
        createdAt: serverTimestamp()
      });
      
      const link = `${window.location.protocol}//${window.location.host}/?token=${token}`;
      setGeneratedLink(link);
      setIsInviteOpen(false);
      setIsSuccessOpen(true);
      toast.success("Entry key provisioned.");
    } catch (error: any) {
      toast.error("Link encryption failed.");
    }
  };

  const updatePaymentStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        payment_status: status,
        updatedAt: serverTimestamp()
      });
      toast.success("Settlement registry updated.");
    } catch (error) {
      toast.error("Ledger write failed.");
    }
  };

  const deleteInvite = async (invite: Invite) => {
    if (!confirm("Terminate this entry key?")) return;
    try {
      await deleteDoc(doc(db, "invites", invite.id || invite.token));
      toast.success("Link purged from system.");
    } catch (error) {
      toast.error("Purge failure.");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.retailerName.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Action Buttons for DashboardLayout
  const actions = (
    <div className="flex items-center gap-3">
        <Button 
            onClick={() => setIsInviteOpen(true)} 
            variant="outline" 
            className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border-zinc-200 transition-all hover:bg-zinc-900 hover:text-white"
        >
            <UserPlus className="mr-2 h-4 w-4" /> Provision Entry
        </Button>
        <Button 
            onClick={() => setIsNewOrderOpen(true)} 
            className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl transition-all hover:scale-[1.02]"
        >
            <Plus className="mr-2 h-4 w-4" /> New Manifest
        </Button>
    </div>
  );

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={activeOrg?.name || "Terminal"}
      subtitle="Supplier Sector Control"
      actions={actions}
    >
      {activeTab === "overview" && <SupplierOverview stats={stats} />}
      {activeTab === "orders" && (
        <SupplierOrders 
            orders={filteredOrders} 
            employees={employees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            onOrderSelect={setSelectedOrderDetail}
            onPaymentStatusUpdate={updatePaymentStatus}
        />
      )}
      {activeTab === "outstanding" && (
        <SupplierOutstanding 
            orders={orders} 
            stats={stats} 
            onOrderSelect={setSelectedOrderDetail} 
        />
      )}
      {activeTab === "insights" && <SupplierInsights stats={stats} />}
      {activeTab === "network" && (
        <SupplierNetwork 
            employees={employees} 
            retailers={retailers} 
            stats={stats} 
        />
      )}
      {activeTab === "invites" && (
        <SupplierInvites 
            invites={invites} 
            onInviteOpen={() => setIsInviteOpen(true)}
            onCopyLink={(token) => {
                const link = `${window.location.protocol}//${window.location.host}/?token=${token}`;
                navigator.clipboard.writeText(link);
                toast.success("Key copied to clipboard.");
            }}
            onDeleteInvite={deleteInvite}
        />
      )}

      {/* Dialogs */}
      <OrderDetailsDialog 
        order={selectedOrderDetail} 
        employees={employees} 
        onClose={() => setSelectedOrderDetail(null)} 
      />
      
      <NewOrderDialog 
        isOpen={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen} 
        retailers={retailers} 
        employees={employees} 
        onSubmit={handleCreateOrder} 
      />

      <InviteDialog 
        isOpen={isInviteOpen} 
        onOpenChange={setIsInviteOpen} 
        onSubmit={handleInvite} 
      />

      {/* Success Link Modal */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Key Constructed</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Deploy this link to the target entity</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 pt-8 pb-4">
            <Input readOnly value={generatedLink || ""} className="font-mono text-xs h-14 rounded-2xl bg-zinc-50 border-none px-6" />
            <Button size="icon" className="h-14 w-14 rounded-2xl bg-zinc-900 text-white" onClick={() => {
              if (generatedLink) {
                navigator.clipboard.writeText(generatedLink);
                toast.success("Link copied.");
              }
            }}>
              <Copy className="h-5 w-5" />
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic bg-zinc-900 text-white" onClick={() => setIsSuccessOpen(false)}>Secure & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
