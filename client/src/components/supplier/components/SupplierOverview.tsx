import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/constants";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  CheckCircle2,
  Coins
} from "lucide-react";
import { motion } from "motion/react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Task } from "@/types";

const OpsTaskAnalytics: React.FC = () => {
  const { activeOrg, preferredCurrency } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrg) return;
    const q = query(collection(db, "tasks"), where("supplierId", "==", activeOrg.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeOrg]);

  const stats = useMemo(() => {
    const checklistTasks = tasks.filter(t => t.taskType === "checklist");
    const clTotal = checklistTasks.length;
    const clCompleted = checklistTasks.filter(t => t.status === "completed" || t.status === "verified").length;

    const procurementTasks = tasks.filter(t => t.taskType === "procurement");
    const prTotal = procurementTasks.length;
    const prAwaiting = procurementTasks.filter(t => t.status === "awaiting_approval").length;
    const prApproved = procurementTasks.filter(t => t.status === "approved").length;
    const prStocked = procurementTasks.filter(t => t.status === "stock_added").length;

    // Total purchase value spent
    let totalPurchasedCost = 0;
    procurementTasks.filter(t => ["approved", "stock_added"].includes(t.status)).forEach(task => {
      task.items?.forEach(item => {
        const qty = item.purchasedQuantity ?? item.quantity;
        const val = item.purchaseCost ?? 0;
        totalPurchasedCost += qty * val;
      });
    });

    return {
      clTotal,
      clCompleted,
      prTotal,
      prAwaiting,
      prApproved,
      prStocked,
      totalPurchasedCost
    };
  }, [tasks]);

  if (loading) {
    return <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest text-center py-4">Sizing Operations feed...</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-zinc-300">
            <ClipboardList className="h-5 w-5" />
          </div>
          <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Checklists Run</span>
        </div>
        <div>
          <h4 className="text-3xl font-black italic tracking-tighter text-white">
            {stats.clCompleted} / {stats.clTotal}
          </h4>
          <p className="text-[9px] text-zinc-400 font-extrabold uppercase mt-1">Verified Completions</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-zinc-300">
            <Coins className="h-5 w-5" />
          </div>
          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Sourced Goods</span>
        </div>
        <div>
          <h4 className="text-3xl font-black italic tracking-tighter text-emerald-400">
            {formatCurrency(stats.totalPurchasedCost, preferredCurrency)}
          </h4>
          <p className="text-[9px] text-zinc-400 font-extrabold uppercase mt-1">Total Sourced Value Issued</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-zinc-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Intake Gate</span>
        </div>
        <div>
          <h4 className="text-3xl font-black italic tracking-tighter text-white">
            {stats.prAwaiting} Rvw / {stats.prApproved} Apr
          </h4>
          <p className="text-[9px] text-zinc-400 font-extrabold uppercase mt-1">
            {stats.prStocked} Fully Integrated Stock
          </p>
        </div>
      </div>
    </div>
  );
};

interface SupplierOverviewProps {
  stats: any;
}

export const SupplierOverview: React.FC<SupplierOverviewProps> = ({ stats }) => {
  const { preferredCurrency } = useAuth();
  const cards = [
    { 
      label: "Gross Revenue", 
      value: formatCurrency(stats.totalRevenue, preferredCurrency), 
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
      value: formatCurrency(stats.outstandingAmount, preferredCurrency), 
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
    },
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
            <Card className={`rounded-[2rem] border-none shadow-sm overflow-hidden ${card.color ? (card.color === "bg-white text-zinc-900" ? "bg-white" : card.color) : "bg-white"}`}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${card.color === "bg-zinc-900 text-white" ? "bg-white/10" : "bg-zinc-50"}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${card.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                    {card.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend === "up" ? "12%" : "4%"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${card.color === "bg-zinc-900 text-white" ? "text-white/90" : "text-zinc-500"}`}>
                    {card.label}
                  </p>
                  <h3 className="text-3xl font-black italic tracking-tighter">
                    {card.value}
                  </h3>
                </div>
                <p className={`mt-4 text-[9px] font-bold uppercase tracking-widest ${card.color === "bg-zinc-900 text-white" ? "text-white/70" : "text-zinc-500"}`}>
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
                  <span className="text-zinc-900">{formatCurrency(emp.collected, preferredCurrency)}</span>
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
                   <p className="text-xs font-black italic">{formatCurrency(ret.revenue, preferredCurrency)}</p>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Internal Operations Control Hub */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-zinc-900 text-white p-10 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Operations Control Hub</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Checklist progress & Procurement pipelines summary</p>
          </div>
          <Badge className="bg-white/10 text-zinc-200 border-none font-bold uppercase text-[9px] py-1 px-3">
            Realtime Analytics Vector
          </Badge>
        </div>

        <OpsTaskAnalytics />
      </Card>
    </div>
  );
};
