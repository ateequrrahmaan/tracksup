import React from "react";
import { formatCurrency } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion } from "motion/react";

interface SupplierOverviewProps {
  stats: any;
}

export const SupplierOverview: React.FC<SupplierOverviewProps> = ({ stats }) => {
  const cards = [
    { 
      label: "Gross Revenue", 
      value: formatCurrency(stats.totalRevenue), 
      sub: "+12.5% from last cycle", 
      icon: DollarSign, 
      color: "bg-zinc-900 text-white",
      trend: "up"
    },
    { 
      label: "Active Orders", 
      value: stats.totalOrders?.toString(), 
      sub: `${stats.paymentBreakdown?.unpaid} awaiting payment`, 
      icon: Package, 
      color: "bg-white text-zinc-900",
      trend: "up"
    },
    { 
      label: "Unpaid Balance", 
      value: formatCurrency(stats.outstandingAmount), 
      sub: "Risk level: Medium", 
      icon: AlertCircle, 
      color: "bg-white text-zinc-900",
      trend: "down"
    },
    { 
      label: "Collection Rate", 
      value: `${stats.totalRevenue > 0 ? Math.round((stats.totalCollected / stats.totalRevenue) * 100) : 0}%`, 
      sub: "Performance goal: 95%", 
      icon: CheckCircle, 
      color: "bg-white text-zinc-900",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`rounded-[2rem] border-none shadow-sm overflow-hidden ${card.color === "bg-white text-zinc-900" ? "bg-white" : card.color}`}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${card.color === "bg-white text-zinc-900" ? "bg-zinc-50" : "bg-white/10"}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${card.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                    {card.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend === "up" ? "12%" : "4%"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${card.color === "bg-white text-zinc-900" ? "text-zinc-500" : "text-white/60"}`}>
                    {card.label}
                  </p>
                  <h3 className="text-3xl font-black italic tracking-tighter">
                    {card.value}
                  </h3>
                </div>
                <p className={`mt-4 text-[9px] font-bold uppercase tracking-widest ${card.color === "bg-white text-zinc-900" ? "text-zinc-500" : "text-white/40"}`}>
                  {card.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Performance Trends</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Employee delivery stats</p>
            </div>
            <TrendingUp className="h-6 w-6 text-zinc-200" />
          </div>
          <div className="space-y-6">
            {stats.employeePerformance?.slice(0, 4).map((emp: any, i: number) => (
              <div key={emp.name} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-600">{emp.name}</span>
                  <span className="text-zinc-900">{formatCurrency(emp.collected)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(emp.collected / stats.totalRevenue) * 100}%` }}
                    className="h-full bg-zinc-900 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Top Retail Partners</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Highest revenue stores</p>
            </div>
            <Clock className="h-6 w-6 text-zinc-200" />
          </div>
          <div className="space-y-4">
             {stats.topRetailers?.map((ret: any, i: number) => (
                <div key={ret.name} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors group cursor-default">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-zinc-900 text-xs italic border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                         {ret.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-tight">{ret.name}</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Retail Partner</p>
                      </div>
                   </div>
                   <p className="text-xs font-black italic">{formatCurrency(ret.revenue)}</p>
                </div>
             ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
