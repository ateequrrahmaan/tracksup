import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, setDoc, deleteDoc, doc, serverTimestamp, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "../shared/DashboardLayout";
import api from "@/services/api";
import { Order, SystemUser, Invite, Product } from "@/types";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";
import { NewOrderDialog } from "./components/NewOrderDialog";
import { InviteDialog } from "./components/InviteDialog";
import { SupplierOverview } from "./components/SupplierOverview";
import { SupplierOrders } from "./components/SupplierOrders";
import { SupplierOutstanding } from "./components/SupplierOutstanding";
import { SupplierInsights } from "./components/SupplierInsights";
import { SupplierNetwork } from "./components/SupplierNetwork";
import { SupplierInvites } from "./components/SupplierInvites";
import { SupplierProducts } from "./components/SupplierProducts";
import { SupplierInventory } from "./components/SupplierInventory";
import { StrategicTools } from "./components/StrategicTools";
import { SupplierTasks } from "./components/SupplierTasks";
import { SettingsView } from "../shared/SettingsView";

import { useLocation } from "react-router-dom";

export const SupplierDashboard = () => {
  const { user, activeOrg } = useAuth();
  const location = useLocation();
  
  // Determine active tab from URL path
  const activeTab = useMemo(() => {
    if (location.pathname === "/supplier") return "overview";
    if (location.pathname === "/supplier/orders") return "orders";
    if (location.pathname === "/supplier/performance") return "insights";
    if (location.pathname === "/supplier/strategy") return "strategy";
    if (location.pathname === "/supplier/retailers" || location.pathname === "/supplier/employees") return "network";
    if (location.pathname === "/supplier/products") return "products";
    if (location.pathname === "/supplier/inventory") return "inventory";
    if (location.pathname === "/supplier/invites") return "invites";
    if (location.pathname === "/supplier/tasks") return "tasks";
    if (location.pathname === "/settings") return "settings";
    return "overview";
  }, [location.pathname]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<SystemUser[]>([]);
  const [retailers, setRetailers] = useState<SystemUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
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
  const [retailerFilter, setRetailerFilter] = useState("all");
  const [fetchedNames, setFetchedNames] = useState<Record<string, string>>({});

  // Fetch missing names (Retailers and Employees)
  useEffect(() => {
    const missingRetailerIds = orders
      .filter(o => !!o.retailerId && !o.retailerName && !retailers.find(r => r.uid === o.retailerId) && !fetchedNames[o.retailerId!])
      .map(o => o.retailerId as string);
    
    const missingEmployeeIds = orders
      .filter(o => !!o.employeeId && !o.employeeName && !employees.find(e => e.uid === o.employeeId) && !fetchedNames[o.employeeId!])
      .map(o => o.employeeId as string);

    const uniqueMissing = Array.from(new Set([...missingRetailerIds, ...missingEmployeeIds])) as string[];

    if (uniqueMissing.length > 0) {
      uniqueMissing.forEach((id: string) => {
        // Use a placeholder
        setFetchedNames(prev => ({ ...prev, [id]: `User ${id.slice(-4).toUpperCase()}` }));
        api.get(`/auth/resolve/${id}`)
          .then(res => {
            const result = res.data.data;
            if (result && result.name) setFetchedNames(prev => ({ ...prev, [id]: result.name }));
          })
          .catch(err => console.error("Error fetching name for:", id, err));
      });
    }
  }, [orders, retailers, employees, fetchedNames]);

  // Data Fetching
  useEffect(() => {
    if (!user || !activeOrg) return;

    const ordersQuery = query(collection(db, "orders"), where("supplierId", "==", activeOrg.id));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      console.log(`[SupplierDashboard] Fetched ${snapshot.size} orders for supplier ${activeOrg.id}`);
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

    const memsQuery = query(
      collection(db, "memberships"), 
      where("organizationId", "==", activeOrg.id),
      where("status", "==", "active")
    );
    const unsubscribeMems = onSnapshot(memsQuery, async (snapshot) => {
      const userIds = Array.from(new Set(snapshot.docs.map(d => d.data().userId)));
      
      if (userIds.length === 0) {
        setRetailers([]);
        setEmployees([]);
        return;
      }

      // Fetch all users in chunks of 30 (Firestore 'in' query limit)
      const usersMap = new Map<string, SystemUser>();
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const usersQuery = query(collection(db, "users"), where("__name__", "in", chunk));
        const userSnaps = await getDocs(usersQuery);
        userSnaps.forEach(u => {
          usersMap.set(u.id, { uid: u.id, ...u.data() } as SystemUser);
        });
      }

      const emps: SystemUser[] = [];
      const rets: SystemUser[] = [];
      
      snapshot.docs.forEach(memDoc => {
        const mem = memDoc.data();
        const userData = usersMap.get(mem.userId);
        if (userData && mem.status === "active") {
          if (mem.role === "employee" && !emps.find(e => e.uid === userData.uid)) emps.push(userData);
          if (mem.role === "retailer" && !rets.find(r => r.uid === userData.uid)) rets.push(userData);
        }
      });

      setEmployees(emps);
      setRetailers(rets);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "memberships");
    });

    const invitesQuery = query(collection(db, "invites"), where("organizationId", "==", activeOrg.id));
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      const uniqueInvites = new Map<string, Invite>();
      snapshot.docs.forEach(d => {
        uniqueInvites.set(d.id, { id: d.id, ...d.data() } as Invite);
      });
      setInvites(Array.from(uniqueInvites.values()));
    });

    const productsQuery = query(collection(db, "products"), where("supplierId", "==", activeOrg.id));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodList);
    }, (error) => {
      console.error("[SupplierDashboard] Products snapshot error:", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMems();
      unsubscribeInvites();
      unsubscribeProducts();
    };
  }, [user, activeOrg]);

  // Derived Stats
  const stats = useMemo(() => {
    const revenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const collected = orders.reduce((acc, curr) => acc + (curr.amount_collected || 0), 0);
    
    // Top Retailers
    const retailerMap = new Map<string, { name: string, revenue: number, orderCount: number }>();
    orders.forEach(o => {
      const current = retailerMap.get(o.retailerId) || { name: o.retailerName, revenue: 0, orderCount: 0 };
      retailerMap.set(o.retailerId, { 
        ...current, 
        revenue: current.revenue + (o.totalAmount || 0),
        orderCount: current.orderCount + 1
      });
    });
    const topRetailers = Array.from(retailerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Employee Performance
    const employeeMap = new Map<string, { name: string, deliveries: number, collected: number, avgTime?: number }>();
    orders.forEach(o => {
      if (!o.employeeId) return;
      const empName = employees.find(e => e.uid === o.employeeId)?.name || "Agent";
      const current = employeeMap.get(o.employeeId) || { name: empName, deliveries: 0, collected: 0, avgTime: undefined as number | undefined };
      
      let deliveryTimeUpdate = {};
      if (o.status === 'delivered' && o.delivered_at && o.createdAt) {
          try {
            const created = typeof o.createdAt === 'object' && 'toDate' in o.createdAt ? o.createdAt.toDate().getTime() : new Date(o.createdAt).getTime();
            const delivered = typeof o.delivered_at === 'object' && o.delivered_at !== null && 'toDate' in o.delivered_at ? o.delivered_at.toDate().getTime() : new Date(o.delivered_at).getTime();
            
            if (!isNaN(created) && !isNaN(delivered)) {
              const hours = (delivered - created) / (1000 * 60 * 60);
              deliveryTimeUpdate = { 
                avgTime: current.avgTime !== undefined ? (current.avgTime + hours) / 2 : hours 
              };
            }
          } catch (e) {
            console.warn("Stats delivery calc error:", e);
          }
      }

      employeeMap.set(o.employeeId, {
        ...current,
        deliveries: current.deliveries + (o.status === 'delivered' ? 1 : 0),
        collected: current.collected + (o.amount_collected || 0),
        ...deliveryTimeUpdate
      });
    });
    const employeePerformance = Array.from(employeeMap.values()).sort((a, b) => b.collected - a.collected);

    // Trend Data (Last 7 Days)
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const now = new Date();
    const trendMap = new Map<string, number>();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      trendMap.set(days[d.getDay()], 0);
    }

    orders.forEach(o => {
      if (!o.createdAt) return;
      try {
        const date = typeof o.createdAt === 'object' && 'toDate' in o.createdAt ? o.createdAt.toDate() : new Date(o.createdAt);
        if (isNaN(date.getTime())) return;
        
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          const dayName = days[date.getDay()];
          if (trendMap.has(dayName)) {
             trendMap.set(dayName, (trendMap.get(dayName) || 0) + o.totalAmount);
          }
        }
      } catch (e) {
        console.warn("Trend calc error:", e);
      }
    });

    const trendData = Array.from(trendMap.entries()).map(([name, value]) => ({ name, value }));

    // Product Breakdown with Cost and Profit
    const productMap = new Map<string, { name: string, quantity: number, revenue: number, cost: number, profit: number }>();
    let totalCost = 0;
    
    orders.forEach(o => {
      o.items?.forEach(item => {
        const matched = products.find(p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        const itemCost = item.quantity * (matched?.unitCost || 0);
        const itemRevenue = item.quantity * item.price;
        const itemProfit = itemRevenue - itemCost;
        
        totalCost += itemCost;
        
        const current = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0, cost: 0, profit: 0 };
        productMap.set(item.name, {
          name: item.name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + itemRevenue,
          cost: current.cost + itemCost,
          profit: current.profit + itemProfit
        });
      });
    });
    const productPerformance = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Increase slice limit for a more complete matrix

    // Efficiency Calculation
    const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.delivered_at);
      const avgDeliveryHours = deliveredOrders.length > 0
      ? deliveredOrders.reduce((acc, o) => {
          try {
            const deliveredTime = typeof o.delivered_at === 'object' && o.delivered_at !== null && 'toDate' in o.delivered_at ? o.delivered_at.toDate().getTime() : new Date(o.delivered_at).getTime();
            const createdTime = typeof o.createdAt === 'object' && o.createdAt !== null && 'toDate' in o.createdAt ? o.createdAt.toDate().getTime() : new Date(o.createdAt).getTime();
            
            if (isNaN(deliveredTime) || isNaN(createdTime)) return acc;
            
            const hours = (deliveredTime - createdTime) / (1000 * 60 * 60);
            return acc + hours;
          } catch (e) {
            return acc;
          }
        }, 0) / deliveredOrders.length
      : 0;

    return {
      totalOrders: orders.length,
      totalRevenue: revenue,
      totalCollected: collected,
      totalCost,
      totalProfit: revenue - totalCost,
      outstandingAmount: revenue - collected,
      paymentBreakdown: {
        paid: orders.filter(o => o.payment_status === "paid").length,
        unpaid: orders.filter(o => !o.payment_status || o.payment_status === "unpaid").length,
        credit: orders.filter(o => o.payment_status === "credit").length
      },
      topRetailers,
      employeePerformance,
      trendData,
      productPerformance,
      avgDeliveryHours
    };
  }, [orders, employees, products]);

  // Handlers
  const handleCreateOrder = async (data: any) => {
    if (!activeOrg || !user) return;
    try {
      await api.post("/orders", {
        ...data,
        supplierId: activeOrg.id,
        supplierName: activeOrg.name,
        retailerName: retailers.find(r => r.uid === data.retailerId)?.name || "Unknown Shop",
        employeeName: employees.find(e => e.uid === data.employeeId)?.name || "",
      });
      setIsNewOrderOpen(false);
      toast.success("Manifest active - Logistics vector initialized.");
    } catch (error: any) {
      console.error("Order creation error:", error);
      const message = error.response?.data?.error?.message || "Signal failure. Manifest rejected.";
      toast.error(message);
    }
  };

  const handleInvite = async (e: any) => {
    e.preventDefault();
    if (!activeOrg || !user) return;

    const formData = new FormData(e.target);
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    
    try {
      // Create a specific invite service/endpoint would be better, but let's use organization as base for now
      // Actually, let's create a generic invite endpoint in organization.routes
      const response = await api.post("/organizations/invite", { email, role });
      const { token } = response.data.data;
      
      const link = `${window.location.protocol}//${window.location.host}/invite/${token}`;
      setGeneratedLink(link);
      setIsInviteOpen(false);
      setIsSuccessOpen(true);
      toast.success("Entry key provisioned.");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Link encryption failed.";
      toast.error(errorMsg);
    }
  };

  const updatePaymentStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/payment`, { status });
      toast.success("Settlement registry updated.");
    } catch (error) {
      toast.error("Ledger write failed.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    console.log(`[SupplierDashboard] handleDeleteOrder CRITICAL ACTION for: ${orderId}`);
    const toastId = toast.loading("Purging manifest from system...");
    try {
      // Optimistic state update or at least immediate feedback
      await api.delete(`/orders/${encodeURIComponent(orderId)}`);
      
      console.log(`[SupplierDashboard] API confirmed deletion for: ${orderId}`);
      
      // Force local filter as fallback to onSnapshot
      setOrders(prev => prev.filter(o => o.id !== orderId));
      
      toast.success("Manifest purged from system.", { id: toastId });
    } catch (error: any) {
      console.error(`[SupplierDashboard] Deletion failed for ${orderId}:`, error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Purge failure.";
      toast.error(`Purge failure: ${errorMsg}`, { id: toastId });
    }
  };

  const assignEmployee = async (orderId: string, employeeId: string) => {
    try {
      const empName = employees.find(e => e.uid === employeeId)?.name || "";
      await api.patch(`/orders/${orderId}/assign`, { 
        employeeId: employeeId === "unassigned" ? null : employeeId,
        employeeName: employeeId === "unassigned" ? "" : empName
      });
      toast.success(employeeId !== "unassigned" ? "Agent initialized on manifest." : "Manifest returned to pending queue.");
    } catch (error) {
      toast.error("Registry update failed.");
    }
  };

  const deleteInvite = async (invite: Invite) => {
    if (!confirm("Terminate this entry key?")) return;
    try {
      await api.delete(`/organizations/invites/${invite.token}`);
      toast.success("Link purged from system.");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Purge failure.";
      toast.error(errorMsg);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.retailerName || fetchedNames[order.retailerId] || "").toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    const matchesRetailer = retailerFilter === "all" || order.retailerId === retailerFilter;
    return matchesSearch && matchesStatus && matchesPayment && matchesRetailer;
  });

  // Action Buttons for DashboardLayout
  const actions = (
    <div className="flex items-center gap-2 sm:gap-3">
        <Button 
            onClick={() => setIsInviteOpen(true)} 
            variant="outline" 
            className="rounded-xl h-10 sm:h-11 px-3 sm:px-6 font-black uppercase text-[10px] tracking-widest border-zinc-200 transition-all hover:bg-zinc-900 hover:text-white shrink-0"
        >
            <UserPlus className="sm:mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">Provision Entry</span>
            <span className="inline sm:hidden">Invite</span>
        </Button>
        <Button 
            onClick={() => setIsNewOrderOpen(true)} 
            className="rounded-xl h-10 sm:h-11 px-3 sm:px-6 font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl transition-all hover:scale-[1.02] shrink-0"
        >
            <Plus className="sm:mr-2 h-4 w-4" /> 
            <span className="hidden sm:inline">New Manifest</span>
            <span className="inline sm:hidden">New</span>
        </Button>
    </div>
  );

  return (
    <DashboardLayout
      title={activeOrg?.name || "Terminal"}
      subtitle="Supplier Sector Control"
      actions={actions}
    >
      {activeTab === "overview" && <SupplierOverview stats={stats} />}
      {activeTab === "orders" && (
        <SupplierOrders 
            orders={filteredOrders} 
            employees={employees}
            retailers={retailers}
            fetchedNames={fetchedNames}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            retailerFilter={retailerFilter}
            setRetailerFilter={setRetailerFilter}
            onOrderSelect={setSelectedOrderDetail}
            onPaymentStatusUpdate={updatePaymentStatus}
            onEmployeeAssign={assignEmployee}
            onOrderDelete={handleDeleteOrder}
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
      {activeTab === "strategy" && <StrategicTools stats={stats} />}
      {activeTab === "network" && (
        <SupplierNetwork 
            employees={employees} 
            retailers={retailers} 
            stats={stats} 
            mode={location.pathname === "/supplier/employees" ? "employees" : "retailers"}
        />
      )}
      {activeTab === "products" && (
        <SupplierProducts 
          orders={orders} 
          employees={employees}
          onPaymentStatusUpdate={updatePaymentStatus}
          onEmployeeAssign={assignEmployee}
          onOrderDelete={handleDeleteOrder}
        />
      )}
      {activeTab === "inventory" && <SupplierInventory />}
      {activeTab === "invites" && (
        <SupplierInvites 
            invites={invites} 
            onInviteOpen={() => setIsInviteOpen(true)}
            onCopyLink={(token) => {
                const link = `${window.location.protocol}//${window.location.host}/invite/${token}`;
                navigator.clipboard.writeText(link);
                toast.success("Key copied to clipboard.");
            }}
            onDeleteInvite={deleteInvite}
        />
      )}
      {activeTab === "tasks" && <SupplierTasks employees={employees} />}
      {activeTab === "settings" && <SettingsView />}

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
        products={products}
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
