import React from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator, 
  TrendingUp, 
  Target, 
  BarChart4, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatCurrency } from "@/constants";

interface StrategicToolsProps {
  stats: any;
}

export const StrategicTools: React.FC<StrategicToolsProps> = ({ stats }) => {
  const [target, setTarget] = React.useState<string>("");
  const currentRevenue = stats.totalRevenue || 0;
  
  const calculateGap = () => {
    const targetVal = parseFloat(target);
    if (isNaN(targetVal)) return null;
    return targetVal - currentRevenue;
  };

  const gap = calculateGap();

  return (
    <div className="space-y-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Projection Tool */}
        <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Calculator className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Revenue Target Vector</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Strategic growth calculator</CardDescription>
              </div>
            </div>

            <div className="space-y-6 max-w-md">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Desired Revenue Goal</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <Input 
                    type="number"
                    placeholder="Enter target amount"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="pl-8 h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus:ring-zinc-900 transition-all font-black"
                  />
                </div>
              </div>

              {gap !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-zinc-900 text-white space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Revenue Gap</p>
                    <div className={`flex items-center gap-1 text-[10px] font-black ${gap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                       {gap > 0 ? 'SHORTFALL' : 'SURPLUS'}
                    </div>
                  </div>
                  <h4 className="text-3xl font-black italic tracking-tighter">{formatCurrency(Math.abs(gap))}</h4>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      To reach this goal, you need approximately <span className="text-white font-bold">{Math.ceil(Math.abs(gap) / (stats.totalRevenue / (stats.totalOrders || 1)))}</span> more orders at your current average order value.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </Card>

        {/* Network Expansion Tools */}
        <Card className="rounded-[2.5rem] bg-zinc-900 text-white border-none shadow-sm p-10 overflow-hidden relative">
          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <Sparkles className="h-64 w-64" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BarChart4 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Market Intel</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Expansion opportunity matrix</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black uppercase italic tracking-tight">Retailer Retention</h4>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">Analyze which retail partners have the highest churn risk based on order frequency decay.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black uppercase italic tracking-tight">Product Mix Optimization</h4>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">Identify complementary products that are frequently missing from high-value orders.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black uppercase italic tracking-tight">Logistics Heatmap</h4>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">Visualize geographic delivery clusters to optimize route density and fuel overhead.</p>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                onClick={() => toast.info("Strategic AI audit initialized. Report will be available in 24h.")}
                className="w-full h-14 rounded-2xl bg-white text-zinc-900 font-black uppercase tracking-widest text-[11px] italic hover:scale-[1.02] transition-all"
              >
                Generate Strategic AI Audit
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Product Success Matrix */}
      <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-10">
         <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Asset Success Matrix</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">ROI per product category</p>
            </div>
            <TrendingUp className="h-6 w-6 text-zinc-200" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {stats.productPerformance?.slice(0, 3).map((product: any) => (
                <div key={product.name} className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-xl italic uppercase text-zinc-900">
                         {product.name.charAt(0)}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest"> High Yield </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asset Class</p>
                      <h4 className="text-lg font-black uppercase italic tracking-tight truncate">{product.name}</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Yield</p>
                         <p className="text-base font-black italic">{formatCurrency(product.revenue)}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Velocity</p>
                         <p className="text-base font-black italic">{product.quantity} units</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
      </Card>
    </div>
  );
};
