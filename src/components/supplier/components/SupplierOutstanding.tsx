import React from "react";
import { Order } from "@/src/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

interface SupplierOutstandingProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  stats: {
    outstandingAmount: number;
  };
}

export const SupplierOutstanding: React.FC<SupplierOutstandingProps> = ({
  orders,
  onOrderSelect,
  stats
}) => {
  const outstandingOrders = orders.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'credit');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <Card className="md:col-span-4 border-none shadow-2xl bg-white rounded-[2.5rem] p-10 flex flex-col justify-center">
           <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2 italic">Total Sector Risk</p>
           <p className="text-5xl font-black italic tracking-tighter text-rose-600">${stats.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </Card>
        <div className="md:col-span-8 bg-zinc-900 rounded-[2.5rem] p-10 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.15),transparent)]" />
           <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 italic">Node Integrity Warning</p>
              <p className="text-3xl font-black italic tracking-tighter group-hover:text-orange-400 transition-colors">
                {outstandingOrders.length} Manifests Awaiting Settlement
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-2">Critical intervention required for aged liquidity units</p>
           </div>
           <div className="relative z-10 h-20 w-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <AlertTriangle className="h-10 w-10 text-orange-500 animate-pulse" />
           </div>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="h-16 border-none">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-10">Retailer Node</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-10">ID Manifest</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-10">Chronological Age</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-10">Partial Collection</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-10">Deficit Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outstandingOrders.map((order) => {
                const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                const daysPending = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
                const balance = order.totalAmount - (order.amount_collected || 0);

                return (
                  <TableRow 
                    key={`outstanding-row-${order.id}`} 
                    className="h-20 border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer group" 
                    onClick={() => onOrderSelect(order)}
                  >
                    <TableCell className="px-10 font-black uppercase italic text-sm group-hover:text-primary transition-colors">{order.retailerName}</TableCell>
                    <TableCell className="px-10">
                       <span className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-lg uppercase tracking-wider">#{order.id.slice(-8).toUpperCase()}</span>
                    </TableCell>
                    <TableCell className="px-10">
                       <Badge variant={daysPending > 7 ? "destructive" : "warning"} className="rounded-xl text-[9px] font-black uppercase tracking-widest italic h-7 px-4 border-none shadow-sm">
                         {daysPending} Solar Cycles Active
                       </Badge>
                    </TableCell>
                    <TableCell className="px-10 font-black italic tracking-tighter text-emerald-600">
                        ${(order.amount_collected || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="px-10 text-right font-black italic tracking-tighter text-rose-600 text-lg">
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
            {outstandingOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center bg-zinc-50/20">
                   <div className="flex flex-col items-center justify-center opacity-20">
                      <div className="h-20 w-20 rounded-[2rem] border-4 border-dashed border-emerald-400 flex items-center justify-center mb-6">
                        <Clock className="h-8 w-8 text-emerald-500" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">All nodes synchronized - zero outstanding risk</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
