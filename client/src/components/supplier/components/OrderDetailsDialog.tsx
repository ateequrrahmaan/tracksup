import React from "react";
import { Order, SystemUser } from "@/types";
import { formatCurrency, getCurrencySymbol } from "@/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, Truck, Store, Users } from "lucide-react";

interface OrderDetailsDialogProps {
  order: Order | null;
  employees: SystemUser[];
  onClose: () => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ order, employees, onClose }) => {
  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-8">
        <div className="space-y-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Order #{order.id.substring(0, 8)}</DialogTitle>
                <DialogDescription className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest mt-1">
                  Generated {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Directly'}
                </DialogDescription>
              </div>
              <Badge variant={(
                order.status === "delivered" ? "success" : 
                order.status === "out_for_delivery" ? "warning" :
                order.status === "assigned" ? "default" : "secondary"
              ) as any} className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] italic">
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Retailer Node</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Store className="h-4 w-4" />
                </div>
                <span className="font-black text-zinc-900 uppercase italic text-sm">{order.retailerName}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Deployed Agent</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <span className="font-black text-zinc-900 uppercase italic text-sm">
                  {employees.find(e => e.uid === order.employeeId)?.name || "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Inventory Manifest</h3>
            <div className="border border-zinc-100 rounded-3xl overflow-hidden divide-y divide-zinc-50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-black text-zinc-900 uppercase italic text-sm">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.quantity} units @ {formatCurrency(item.price, order.currency)}</span>
                  </div>
                  <span className="font-black text-zinc-900 italic tracking-tighter">{formatCurrency(item.quantity * item.price, order.currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-6 bg-zinc-900 text-white">
                <span className="font-black uppercase text-[10px] tracking-[0.2em] italic opacity-50">Total Capital Value ({order.currency || 'USD'})</span>
                <span className="text-2xl font-black italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Payment Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border-none shadow-sm bg-emerald-500/5 rounded-2xl">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Collected</p>
                <p className="text-xl font-black text-emerald-900 italic tracking-tighter">{formatCurrency(order.amount_collected || 0, order.currency)}</p>
              </Card>
              <Card className="p-4 border-none shadow-sm bg-blue-500/5 rounded-2xl">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 tracking-widest">Settlement</p>
                <p className="text-[10px] font-black uppercase text-blue-900 h-7 flex items-center italic">{order.payment_status || "Unpaid"}</p>
              </Card>
              <Card className="p-4 border-none shadow-sm bg-rose-500/5 rounded-2xl">
                <p className="text-[9px] font-black text-rose-600 uppercase mb-2 tracking-widest">Awaiting</p>
                <p className="text-xl font-black text-rose-900 italic tracking-tighter">{formatCurrency(order.totalAmount - (order.amount_collected || 0), order.currency)}</p>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Operational Timeline</h3>
            <div className="space-y-6 pt-2">
              <div className="relative pl-8 border-l-2 border-dashed border-zinc-100 pb-1">
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <div>
                  <p className="text-[10px] font-black uppercase italic text-zinc-900">Order Genesis</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              <div className="relative pl-8 border-l-2 border-dashed border-zinc-100 pb-1">
                <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-4 border-white shadow-sm ${order.employeeId ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                <div>
                  <p className={`text-[10px] font-black uppercase italic ${order.employeeId ? 'text-zinc-900' : 'text-zinc-400'}`}>Agent Assignment</p>
                  {order.employeeId && (
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Assigned to {employees.find(e => e.uid === order.employeeId)?.name}</p>
                  )}
                </div>
              </div>
              <div className="relative pl-8 pb-1">
                <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-4 border-white shadow-sm ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                <div>
                  <p className={`text-[10px] font-black uppercase italic ${order.status === 'delivered' ? 'text-zinc-900' : 'text-zinc-400'}`}>Mission Completion</p>
                  {order.status === 'delivered' && (
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Success - Delivered to Node</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] italic border-zinc-200" onClick={onClose}>Terminate View</Button>
            {order.status !== 'delivered' && (
              <Button className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] italic bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl">
                Generate Label
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
