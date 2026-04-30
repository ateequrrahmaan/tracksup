import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SupplierInsightsProps {
  stats: {
    topRetailers: { name: string, revenue: number }[];
    employeePerformance: { name: string, deliveries: number, collected: number }[];
  };
}

export const SupplierInsights: React.FC<SupplierInsightsProps> = ({ stats }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden group">
             <CardHeader className="p-10 border-b border-zinc-50 bg-zinc-50/10">
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Prime Node Performance</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Historical revenue generation by retail node</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-zinc-50">
                   {stats.topRetailers.map((r, i) => (
                      <div key={`top-retailer-${i}`} className="p-8 flex items-center justify-between hover:bg-zinc-50 transition-all duration-300 group/item">
                         <div className="flex items-center gap-6">
                            <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black italic shadow-xl group-hover/item:rotate-6 transition-transform">
                               #{i+1}
                            </div>
                            <span className="font-black uppercase italic text-sm text-zinc-900 tracking-tight">{r.name}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-1 italic">Generated Revenue</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-600">${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   ))}
                   {stats.topRetailers.length === 0 && (
                      <div className="p-20 text-center opacity-20">
                         <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting node synchronization data</p>
                      </div>
                   )}
                </div>
             </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-zinc-900 text-white overflow-hidden relative group">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent)]" />
             <CardHeader className="p-10 border-b border-white/5 relative z-10 bg-white/5">
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Operative Velocity</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mt-1">Real-time mission completion & collection metrics</CardDescription>
             </CardHeader>
             <CardContent className="p-0 relative z-10">
                <div className="divide-y divide-white/5">
                   {stats.employeePerformance.map((e, i) => (
                      <div key={`employee-perf-${i}`} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all duration-300 group/item">
                         <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-3xl border-2 border-white/10 flex items-center justify-center text-zinc-500 font-black italic uppercase text-lg bg-white/5 shadow-2xl group-hover/item:border-blue-500 transition-colors">
                               {e.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-black uppercase italic text-sm text-white tracking-tight">{e.name}</p>
                               <div className="flex items-center gap-3 mt-1.5">
                                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 italic">{e.deliveries} Completions</p>
                                 <div className="h-1 w-1 rounded-full bg-zinc-700" />
                                 <p className="text-[10px] font-black uppercase text-blue-400 italic">Level A Agent</p>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 italic">Total Collected</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-400">${e.collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                   ))}
                   {stats.employeePerformance.length === 0 && (
                      <div className="p-20 text-center opacity-20">
                         <p className="text-[10px] font-black uppercase tracking-widest italic text-white">No active operatives detected</p>
                      </div>
                   )}
                </div>
             </CardContent>
          </Card>
       </div>
    </div>
  );
};
