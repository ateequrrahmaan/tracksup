import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Zap, 
  Target, 
  ShieldAlert, 
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import { motion } from "motion/react";

interface SupplierInsightsProps {
  stats: any;
}

export const SupplierInsights: React.FC<SupplierInsightsProps> = ({ stats }) => {
  const pieData = [
    { name: "Paid", value: stats.paymentBreakdown?.paid || 0, color: "#10b981" },
    { name: "Credit", value: stats.paymentBreakdown?.credit || 0, color: "#3b82f6" },
    { name: "Unpaid", value: stats.paymentBreakdown?.unpaid || 0, color: "#f43f5e" }
  ];

  const chartData = stats.trendData || [];

  return (
    <div className="space-y-10 pb-20">
      {/* Top Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 rounded-[2.5rem] bg-zinc-900 text-white p-6 sm:p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
               <Activity className="h-full w-full stroke-[0.5]" />
            </div>
            <div className="relative z-10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">Network Efficiency</h3>
               <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">System operation <br />is nominal.</h2>
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 mt-12">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Avg Delivery</p>
                  <p className="text-xl font-black italic">{stats.avgDeliveryHours.toFixed(1)}h</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Collection</p>
                  <p className="text-xl font-black italic">{stats.totalRevenue > 0 ? Math.round((stats.totalCollected / stats.totalRevenue) * 100) : 0}%</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Node Sync</p>
                  <p className="text-xl font-black italic">Live</p>
               </div>
            </div>
         </Card>

         <Card className="rounded-[2.5rem] bg-white p-6 sm:p-10 flex flex-col justify-between">
            <div className="flex justify-between items-start flex-wrap gap-4">
               <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Risk Projection</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Settlement latency</p>
               </div>
               <ShieldAlert className="h-6 w-6 text-zinc-200" />
            </div>
            <div className="py-10">
               <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                     <div className="h-full bg-emerald-500 w-[70%]" />
                     <div className="h-full bg-amber-500 w-[20%]" />
                     <div className="h-full bg-rose-500 w-[10%]" />
                  </div>
                  <motion.div 
                    initial={{ left: 0 }}
                    animate={{ left: `${Math.min(95, (stats.outstandingAmount / (stats.totalRevenue || 1)) * 100)}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xl -ml-0.5 z-10" 
                  />
               </div>
               <div className="flex justify-between mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Safe</span>
                  <span>Caution</span>
                  <span>Alert</span>
               </div>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3">
               <div className={`h-2 w-2 rounded-full animate-pulse ${stats.outstandingAmount > stats.totalRevenue * 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
               <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-600">
                 {stats.outstandingAmount > stats.totalRevenue * 0.3 ? 'Revenue retention requires attention' : 'Financial vectors are stable'}
               </p>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] bg-white p-6 sm:p-10 border-none shadow-sm">
          <div className="flex justify-between items-center mb-10 text-zinc-900">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Financial Flow</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Revenue trend (Last 7 Days)</p>
            </div>
            <Layers className="h-6 w-6 text-zinc-200" />
          </div>
          <div className="h-80 w-full text-zinc-900">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#71717a' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#18181b" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] bg-white p-6 sm:p-10 border-none shadow-sm">
          <div className="flex justify-between items-center mb-10 text-zinc-900">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Product Performance</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Top generating assets</p>
            </div>
            <TrendingUp className="h-6 w-6 text-zinc-200" />
          </div>
          <div className="space-y-6">
            {stats.productPerformance?.map((product: any, i: number) => (
              <div key={product.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-zinc-400">0{i+1}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{product.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 italic">Qty: {product.quantity}</span>
                </div>
                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.revenue / (stats.totalRevenue || 1)) * 100}%` }}
                    className="h-full bg-zinc-900 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] bg-white p-6 sm:p-10 border-none shadow-sm">
          <div className="flex justify-between items-center mb-10 text-zinc-900">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Settlement Mix</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Payment status distribution</p>
            </div>
            <Activity className="h-6 w-6 text-zinc-200" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full h-64 sm:h-80 flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-40 flex flex-row sm:flex-col justify-center sm:justify-start gap-6 sm:gap-4 sm:space-y-4 pr-0 sm:pr-4 flex-wrap">
               {pieData.map((item) => (
                  <div key={item.name} className="space-y-1 flex flex-col items-center sm:items-start">
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.name}</span>
                     </div>
                     <p className="text-xl font-black italic sm:ml-4">{item.value}</p>
                  </div>
               ))}
            </div>
          </div>
        </Card>
        
        <Card className="rounded-[2.5rem] bg-zinc-900 text-white p-6 sm:p-10 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -bottom-10 -right-10 opacity-5">
             <Zap className="h-64 w-64" />
          </div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-6">Optimization Insights</h3>
            <div className="space-y-8">
              <div className="flex gap-4">
                 <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase italic tracking-tight">Growth Trajectory</h4>
                    <p className="text-[10px] text-white/50 mt-1 leading-relaxed">Your network has expanded by {stats.topRetailers.length} active retail nodes this cycle.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-amber-400" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase italic tracking-tight">Latency Optimization</h4>
                    <p className="text-[10px] text-white/50 mt-1 leading-relaxed">Average delivery time is currently {stats.avgDeliveryHours.toFixed(1)}h. Aiming for &lt;12h would increase retention by 15%.</p>
                 </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 pt-10">
             <Button className="w-full h-14 rounded-2xl bg-white text-zinc-900 font-black uppercase tracking-widest text-[11px] italic hover:bg-zinc-100 transition-all">
                Export Strategic Audit
             </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
