import React from "react";
import { Order, SystemUser } from "@/types";
import { formatCurrency } from "@/constants";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SupplierOrdersProps {
  orders: Order[];
  employees: SystemUser[];
  retailers: SystemUser[];
  fetchedNames: Record<string, string>;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  paymentFilter: string;
  setPaymentFilter: (val: string) => void;
  retailerFilter: string;
  setRetailerFilter: (val: string) => void;
  onOrderSelect: (order: Order) => void;
  onPaymentStatusUpdate: (orderId: string, status: string) => void;
  onEmployeeAssign: (orderId: string, employeeId: string) => void;
}

export const SupplierOrders: React.FC<SupplierOrdersProps> = ({
  orders,
  employees,
  retailers,
  fetchedNames,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  retailerFilter,
  setRetailerFilter,
  onOrderSelect,
  onPaymentStatusUpdate,
  onEmployeeAssign,
}) => {
  // Compute unique retailers for filter
  const uniqueRetailerIds = Array.from(new Set(orders.map(o => o.retailerId).filter(Boolean))) as string[];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-[2rem] shadow-xl border border-zinc-50">
        <div className="flex-1 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-zinc-900 transition-colors">
            <Search className="h-full w-full" />
          </div>
          <Input 
            placeholder="Search orders by ID or Retailer..." 
            className="pl-14 rounded-2xl h-14 border-none bg-zinc-50 font-black text-xs uppercase italic tracking-widest focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={retailerFilter} onValueChange={setRetailerFilter}>
            <SelectTrigger className="w-[180px] rounded-2xl h-14 border-none bg-zinc-50 font-black uppercase text-[10px] tracking-widest italic px-6 shadow-sm">
              <SelectValue placeholder="Retailer" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
              <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">ALL RETAILERS</SelectItem>
              {uniqueRetailerIds.map((id: string) => {
                const name = retailers.find(r => r.uid === id)?.name || fetchedNames[id] || `Retailer ${id.slice(-4).toUpperCase()}`;
                return (
                  <SelectItem key={id} value={id} className="font-black uppercase text-[9px] tracking-widest py-3">{name}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-2xl h-14 border-none bg-zinc-50 font-black uppercase text-[10px] tracking-widest italic px-6 shadow-sm">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">ALL ORDERS</SelectItem>
              <SelectItem value="pending" className="font-black uppercase text-[9px] tracking-widest py-3">PENDING</SelectItem>
              <SelectItem value="assigned" className="font-black uppercase text-[9px] tracking-widest py-3">ASSIGNED</SelectItem>
              <SelectItem value="out_for_delivery" className="font-black uppercase text-[9px] tracking-widest py-3">IN TRANSIT</SelectItem>
              <SelectItem value="delivered" className="font-black uppercase text-[9px] tracking-widest py-3">DELIVERED</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[180px] rounded-2xl h-14 border-none bg-zinc-50 font-black uppercase text-[10px] tracking-widest italic px-6 shadow-sm">
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">ALL PAYMENTS</SelectItem>
              <SelectItem value="paid" className="font-black uppercase text-[9px] tracking-widest py-3">PAID</SelectItem>
              <SelectItem value="unpaid" className="font-black uppercase text-[9px] tracking-widest py-3">UNPAID</SelectItem>
              <SelectItem value="credit" className="font-black uppercase text-[9px] tracking-widest py-3">CREDIT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900">
              <TableRow className="hover:bg-zinc-900 border-none h-16">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Order ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Retailer</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Delivery Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Payment</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Assigned To</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow 
                  key={`orders-row-${order.id}`} 
                  className="cursor-pointer hover:bg-zinc-50/80 transition-all group h-20 border-b border-zinc-50"
                  onClick={() => onOrderSelect(order)}
                >
                  <TableCell className="px-10">
                    <span className="font-mono text-[10px] font-black text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-lg uppercase tracking-wider">#{order.id.slice(-8).toUpperCase()}</span>
                  </TableCell>
                  <TableCell className="px-10">
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900 uppercase italic text-sm group-hover:text-primary transition-colors">
                        {order.retailerName || retailers.find(r => r.uid === order.retailerId)?.name || fetchedNames[order.retailerId] || `Retailer ${order.retailerId?.slice(-4).toUpperCase()}`}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic mt-0.5">Scheduled: {order.deliveryDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-10">
                    <Badge variant={(
                      order.status === "delivered" ? "success" : 
                      order.status === "out_for_delivery" ? "warning" :
                      order.status === "assigned" ? "default" : "secondary"
                    ) as any} className="rounded-xl h-7 font-black uppercase text-[9px] italic px-4 tracking-[0.1em] border-none">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={order.payment_status || "unpaid"} 
                        onValueChange={(val: string) => onPaymentStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={`h-9 w-28 text-[9px] font-black uppercase tracking-widest rounded-xl border-none shadow-sm ${
                          order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 
                          order.payment_status === 'credit' ? 'bg-blue-500/10 text-blue-600' : 
                          'bg-rose-500/10 text-rose-600'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                          <SelectItem value="paid" className="font-black uppercase text-[9px] tracking-widest py-3">FINALIZED</SelectItem>
                          <SelectItem value="unpaid" className="font-black uppercase text-[9px] tracking-widest py-3">PENDING</SelectItem>
                          <SelectItem value="credit" className="font-black uppercase text-[9px] tracking-widest py-3">BUFFER</SelectItem>
                        </SelectContent>
                      </Select>
                  </TableCell>
                  <TableCell className="px-10" onClick={(e) => e.stopPropagation()}>
                    <Select 
                      value={order.employeeId || "unassigned"} 
                      onValueChange={(val: string) => onEmployeeAssign(order.id, val)}
                    >
                      <SelectTrigger className="h-10 border-none bg-zinc-50 font-black uppercase text-[10px] tracking-tight italic rounded-xl px-4 shadow-sm w-[160px]">
                        <SelectValue placeholder="Assign Agent" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                         <SelectItem value="unassigned" className="font-black uppercase text-[9px] tracking-widest py-3">
                           <div className="flex items-center gap-2 text-zinc-400">
                             <AlertCircle className="h-3 w-3" />
                             NOT ASSIGNED
                           </div>
                         </SelectItem>
                         {employees.map(emp => (
                           <SelectItem key={emp.uid} value={emp.uid} className="font-black uppercase text-[9px] tracking-widest py-3">
                             <div className="flex items-center gap-3">
                               <div className="h-6 w-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-[8px]">
                                 {emp.name?.charAt(0)}
                               </div>
                               {emp.name}
                             </div>
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-10 text-right">
                    <div className="flex items-center justify-end gap-5 group-hover:translate-x-2 transition-all">
                      <span className="font-black text-zinc-900 text-lg italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</span>
                      <div className="h-8 w-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                          <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-zinc-100">
          {orders.map((order) => (
            <div 
              key={`orders-mobile-${order.id}`}
              className="p-6 space-y-4 active:bg-zinc-50 transition-colors"
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-zinc-900 uppercase italic text-sm">
                      {order.retailerName || retailers.find(r => r.uid === order.retailerId)?.name || fetchedNames[order.retailerId] || `Retailer ${order.retailerId?.slice(-4).toUpperCase()}`}
                    </span>
                    <Badge variant={(
                      order.status === "delivered" ? "success" : 
                      order.status === "out_for_delivery" ? "warning" :
                      order.status === "assigned" ? "default" : "secondary"
                    ) as any} className="rounded-lg h-5 font-black uppercase text-[7px] italic px-2 tracking-[0.1em] border-none">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="font-mono text-[9px] font-black text-zinc-400 uppercase tracking-wider">#{order.id.slice(-8).toUpperCase()} • {order.deliveryDate}</p>
                </div>
                <p className="font-black text-zinc-900 text-lg italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Payment</p>
                  <Select 
                    value={order.payment_status || "unpaid"} 
                    onValueChange={(val: string) => onPaymentStatusUpdate(order.id, val)}
                  >
                    <SelectTrigger className={`h-8 w-full text-[8px] font-black uppercase tracking-widest rounded-lg border-none shadow-sm ${
                      order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 
                      order.payment_status === 'credit' ? 'bg-blue-500/10 text-blue-600' : 
                      'bg-rose-500/10 text-rose-600'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl p-2 min-w-[140px]">
                      <SelectItem value="paid" className="font-black uppercase text-[8px] tracking-widest py-2">FINALIZED</SelectItem>
                      <SelectItem value="unpaid" className="font-black uppercase text-[8px] tracking-widest py-2">PENDING</SelectItem>
                      <SelectItem value="credit" className="font-black uppercase text-[8px] tracking-widest py-2">BUFFER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Assignment</p>
                  <Select 
                    value={order.employeeId || "unassigned"} 
                    onValueChange={(val: string) => onEmployeeAssign(order.id, val)}
                  >
                    <SelectTrigger className="h-8 w-full border-none bg-zinc-50 font-black uppercase text-[8px] tracking-tight italic rounded-lg px-3 shadow-sm">
                      <SelectValue placeholder="Assign Agent" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl p-2 min-w-[200px]">
                       <SelectItem value="unassigned" className="font-black uppercase text-[8px] tracking-widest py-2">
                         UNASSIGNED
                       </SelectItem>
                       {employees.map(emp => (
                         <SelectItem key={emp.uid} value={emp.uid} className="font-black uppercase text-[8px] tracking-widest py-2">
                           <div className="flex items-center gap-2">
                             <div className="h-4 w-4 rounded bg-zinc-900 text-white flex items-center justify-center font-black text-[7px]">
                               {emp.name?.charAt(0)}
                             </div>
                             {emp.name}
                           </div>
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center opacity-20 bg-zinc-50/20">
              <div className="h-20 w-20 rounded-[2rem] border-4 border-dashed border-zinc-400 flex items-center justify-center mb-6">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No matching orders found</p>
          </div>
        )}
      </Card>
    </div>
  );
};
