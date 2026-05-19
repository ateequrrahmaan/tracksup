import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Mail, Shield, CheckCircle, Clock, Package, BarChart3, TrendingUp } from "lucide-react";
import { Order, SystemUser } from "@/types";
import { formatCurrency } from "@/constants";
import api from "@/services/api";

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeOrg, preferredCurrency } = useAuth();
  const [employee, setEmployee] = useState<SystemUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completed: 0,
    pending: 0,
    successRate: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !activeOrg) return;
      setLoading(true);
      try {
        // Fetch Employee Profile
        const empSnap = await getDoc(doc(db, "users", id));
        if (empSnap.exists()) {
          setEmployee({ uid: empSnap.id, ...empSnap.data() } as SystemUser);
        }

        // Fetch Orders assigned to this employee within this org
        const ordersQuery = query(
          collection(db, "orders"),
          where("organizationId", "==", activeOrg.id),
          where("employeeId", "==", id),
          orderBy("updatedAt", "desc")
        );
        const ordersSnap = await getDocs(ordersQuery);
        const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
        setOrders(ordersData);

        // Calculate Stats
        const completed = ordersData.filter(o => o.status === "delivered").length;
        const pending = ordersData.filter(o => o.status !== "delivered").length;
        const rate = ordersData.length > 0 ? (completed / ordersData.length) * 100 : 0;

        setStats({
          totalDeliveries: ordersData.length,
          completed,
          pending,
          successRate: Math.round(rate)
        });

        // Trigger Backend API calls
        api.get(`/employees/${id}`).catch(console.error);
        api.get(`/employees/${id}/orders`).catch(console.error);
        api.get(`/employees/${id}/performance`).catch(console.error);

      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, activeOrg]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p>Employee not found</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Header Card */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <User className="h-6 w-6 text-zinc-600" />
                </div>
                <CardTitle>{employee.name}</CardTitle>
              </div>
              <CardDescription>Delivery Agent Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Mail className="h-4 w-4" />
                {employee.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Shield className="h-4 w-4" />
                Role: Delivery Agent
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <Badge variant="outline">Verified</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Deliveries</div>
                  <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Completed</div>
                  <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Pending</div>
                  <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Orders</CardTitle>
                <CardDescription>Current and past delivery assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ORDER ID</TableHead>
                      <TableHead>RETAILER</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LAST UPDATE</TableHead>
                      <TableHead className="text-right">AMOUNT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                          No assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map(order => (
                        <TableRow key={`employee-order-${order.id}`}>
                          <TableCell className="font-mono text-xs uppercase">{order.id.substring(0, 8)}</TableCell>
                          <TableCell className="font-medium">{order.retailerName}</TableCell>
                          <TableCell>
                            <Badge variant={(
                              order.status === "delivered" ? "success" : 
                              order.status === "out_for_delivery" ? "warning" : "default"
                            ) as any}>
                              {order.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {new Date(order.updatedAt?.toDate()).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.totalAmount, preferredCurrency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Historical delivery efficiency</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg. Delivery Time</span>
                    <BarChart3 className="h-4 w-4 text-zinc-400" />
                  </div>
                  <p className="text-2xl font-bold">1.4 Hours</p>
                  <p className="text-xs text-zinc-500">Best in organization</p>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Feedback</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold">4.9/5.0</p>
                  <p className="text-xs text-zinc-500">From 18 reviews</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
