import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, CheckCircle, TrendingDown, PieChart } from "lucide-react";

interface SupplierOverviewProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    totalCollected: number;
    outstandingAmount: number;
    paymentBreakdown: {
      paid: number;
      unpaid: number;
      credit: number;
    };
  };
}

export const SupplierOverview: React.FC<SupplierOverviewProps> = ({ stats }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-500/5 px-8 pt-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 italic">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-4xl font-black text-zinc-900 italic tracking-tighter">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-zinc-400 mt-3 font-bold uppercase tracking-[0.2em] italic">{stats.totalOrders} Global Units Registry</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-500/5 px-8 pt-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 italic">Capital Flow</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-4xl font-black text-zinc-900 italic tracking-tighter">${stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-zinc-400 mt-3 font-bold uppercase tracking-[0.2em] italic">{((stats.totalCollected / (stats.totalRevenue || 1)) * 100).toFixed(1)}% Flux Completion</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-rose-500/5 px-8 pt-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 italic">Inertial Debt</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-4xl font-black text-rose-600 italic tracking-tighter">${stats.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-zinc-400 mt-3 font-bold uppercase tracking-[0.2em] italic">Active Liquidity Friction</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-zinc-900 rounded-[2.5rem] overflow-hidden group hover:scale-[1.05] transition-all duration-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/5 px-8 pt-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">System Integrity</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex items-end gap-3 h-12 mb-2">
                <div className="w-4 bg-emerald-500 rounded-full group-hover:scale-y-110 transition-transform origin-bottom" style={{ height: `${(stats.paymentBreakdown.paid / (stats.totalOrders || 1)) * 100}%` }} />
                <div className="w-4 bg-rose-500 rounded-full group-hover:scale-y-110 transition-transform origin-bottom delay-75" style={{ height: `${(stats.paymentBreakdown.unpaid / (stats.totalOrders || 1)) * 100}%` }} />
                <div className="w-4 bg-blue-500 rounded-full group-hover:scale-y-110 transition-transform origin-bottom delay-150" style={{ height: `${(stats.paymentBreakdown.credit / (stats.totalOrders || 1)) * 100}%` }} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-tight italic">
                {stats.paymentBreakdown.paid}P / {stats.paymentBreakdown.unpaid}U / {stats.paymentBreakdown.credit}C Nodes
             </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-zinc-50 bg-zinc-50/30">
            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Financial Topology</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Payment vector breakdown by categorical status</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
             <div className="space-y-10 w-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest italic text-emerald-600">Finalized Assets (Paid)</span>
                    <span className="text-xl font-black italic tracking-tighter text-zinc-900">{stats.paymentBreakdown.paid}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-1000" style={{ width: `${(stats.paymentBreakdown.paid / (stats.totalOrders || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest italic text-rose-600">Pending Friction (Unpaid)</span>
                    <span className="text-xl font-black italic tracking-tighter text-zinc-900">{stats.paymentBreakdown.unpaid}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-1000" style={{ width: `${(stats.paymentBreakdown.unpaid / (stats.totalOrders || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest italic text-blue-600">Credit Buffer (Extended)</span>
                    <span className="text-xl font-black italic tracking-tighter text-zinc-900">{stats.paymentBreakdown.credit}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-1000" style={{ width: `${(stats.paymentBreakdown.credit / (stats.totalOrders || 1)) * 100}%` }} />
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-2xl bg-zinc-900 text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
          <CardHeader className="p-10 border-b border-white/5 relative z-10">
            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Tactical Operations</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Live organizational vector count analysis</CardDescription>
          </CardHeader>
          <CardContent className="p-10 flex flex-col items-center justify-center relative z-10">
             <div className="relative h-64 w-64 flex items-center justify-center">
                <div className="absolute inset-0 border-[6px] border-dashed border-white/10 rounded-full animate-[spin_30s_linear_infinite]" />
                <div className="absolute inset-8 border-[2px] border-dashed border-white/5 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                <div className="text-center group">
                   <p className="text-7xl font-black italic tracking-tighter group-hover:scale-110 transition-transform duration-500 group-hover:text-blue-400">{stats.totalOrders}</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-4 italic">Active Manifests</p>
                </div>
             </div>
             <div className="mt-8 flex gap-3">
                <div className="h-1.5 w-8 bg-blue-500 rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
