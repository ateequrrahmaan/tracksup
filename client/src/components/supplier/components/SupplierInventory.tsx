import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Product, Order, OrderItem } from "@/types";
import { formatCurrency } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Package, 
  Coins, 
  TrendingUp, 
  AlertCircle, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  Calculator,
  Loader2,
  FileText
} from "lucide-react";

interface RestockHistoryItem {
  quantityAdded: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes?: string;
  productName: string;
}

export const SupplierInventory: React.FC = () => {
  const { activeOrg, preferredCurrency } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "low" | "sufficient">("all");
  
  // Restock Dialog State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [unitCostInput, setUnitCostInput] = useState("");
  const [restockNotes, setRestockNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to Products and Orders in real-time
  useEffect(() => {
    if (!activeOrg) return;

    setLoading(true);
    const prodQuery = query(collection(db, "products"), where("supplierId", "==", activeOrg.id));
    const unsubscribeProds = onSnapshot(prodQuery, (snapshot) => {
      const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodList);
      setLoading(false);
    }, (err) => {
      console.error("Products subscription error:", err);
      toast.error("Failed to establish products stream.");
      setLoading(false);
    });

    const ordQuery = query(collection(db, "orders"), where("supplierId", "==", activeOrg.id));
    const unsubscribeOrds = onSnapshot(ordQuery, (snapshot) => {
      const ordList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordList);
    }, (err) => {
      console.error("Orders subscription error:", err);
    });

    return () => {
      unsubscribeProds();
      unsubscribeOrds();
    };
  }, [activeOrg]);

  // Aggregate pending product demands
  const pendingDemands = useMemo(() => {
    const demandMap: Record<string, number> = {};
    const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "assigned");
    
    pendingOrders.forEach(order => {
      order.items?.forEach(item => {
        const normalizedName = item.name.toLowerCase().trim();
        demandMap[normalizedName] = (demandMap[normalizedName] || 0) + item.quantity;
      });
    });
    return demandMap;
  }, [orders]);

  // Combined product detail mapping for display and calculations
  const productMetrics = useMemo(() => {
    return products.map(p => {
      const normalizedName = p.name.toLowerCase().trim();
      const requestedQty = pendingDemands[normalizedName] || 0;
      const currentStock = typeof p.stock === "number" ? p.stock : 0;
      const isLowStock = currentStock > 0 && currentStock <= 10;
      const isOutOfStock = currentStock === 0;
      
      let stockStatus: "out" | "low" | "sufficient" = "sufficient";
      if (isOutOfStock) stockStatus = "out";
      else if (isLowStock) stockStatus = "low";

      const deficit = Math.max(0, requestedQty - currentStock);

      return {
        ...p,
        currentStock,
        requestedQty,
        deficit,
        stockStatus,
        fulfillable: deficit === 0
      };
    });
  }, [products, pendingDemands]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productMetrics.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = stockFilter === "all" || p.stockStatus === stockFilter;
      return matchesSearch && matchesFilter;
    });
  }, [productMetrics, searchTerm, stockFilter]);

  // Aggregate global asset financial indicators metrics
  const financialTotals = useMemo(() => {
    let totalStockValue = 0;
    let totalCapitalInvested = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const stock = typeof p.stock === "number" ? p.stock : 0;
      // Valuation at market price
      totalStockValue += stock * (p.price || 0);

      const history = (p as any).restockHistory || [];
      // Calculate capital spent
      let cumulativeInvestment = 0;
      if (history.length > 0) {
        cumulativeInvestment = history.reduce((sum: number, h: any) => sum + (h.totalCost || 0), 0);
      } else {
        // Fallback if no history log is populated
        const unitCost = (p as any).unitCost || (p.price * 0.5); // Default estimate 50%
        cumulativeInvestment = stock * unitCost;
      }
      totalCapitalInvested += cumulativeInvestment;

      if (stock === 0) outOfStockCount++;
      else if (stock <= 10) lowStockCount++;
    });

    const netValueAfterInvestment = totalStockValue - totalCapitalInvested;

    return {
      totalStockValue,
      totalCapitalInvested,
      netValueAfterInvestment,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Assemble full historical investment and restocking runs
  const chronologicalHistoryLog = useMemo(() => {
    const list: RestockHistoryItem[] = [];
    products.forEach(p => {
      const history = (p as any).restockHistory || [];
      history.forEach((h: any) => {
        list.push({
          productName: p.name,
          quantityAdded: h.quantityAdded,
          unitCost: h.unitCost,
          totalCost: h.totalCost || (h.quantityAdded * h.unitCost),
          date: h.date || new Date().toISOString(),
          notes: h.notes || "System balance correction"
        });
      });
    });
    // Sort in reverse chronological order
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [products]);

  // Quick Action triggered by the Production Section (Fulfillment alerts)
  const triggerQuickProduction = (product: typeof productMetrics[0]) => {
    setSelectedProductId(product.id);
    setRestockQty(product.deficit.toString());
    const unitPrice = product.price || 0;
    // Estimate a standard production cost if not exists (e.g. 60% of sale price)
    const estimatedCost = (product as any).unitCost || (unitPrice * 0.6);
    setUnitCostInput(estimatedCost.toFixed(2));
    setRestockNotes(`Fulfillment run for outstanding retail demand. Required deficit: ${product.deficit} units.`);
    setIsRestockOpen(true);
  };

  const handleOpenRestockModal = () => {
    setSelectedProductId("");
    setRestockQty("");
    setUnitCostInput("");
    setRestockNotes("");
    setIsRestockOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !restockQty || !unitCostInput) {
      toast.error("Please fill in all parameter fields");
      return;
    }

    const qty = parseInt(restockQty);
    const unitCost = parseFloat(unitCostInput);

    if (isNaN(qty) || qty <= 0) {
      toast.error("Restock quantity must be a positive integer");
      return;
    }

    if (isNaN(unitCost) || unitCost < 0) {
      toast.error("Unit cost cannot be negative");
      return;
    }

    setIsSubmitting(true);
    try {
      const prodRef = doc(db, "products", selectedProductId);
      const productObj = products.find(p => p.id === selectedProductId);
      if (!productObj) throw new Error("Target product structure missing");

      const existingStock = typeof productObj.stock === "number" ? productObj.stock : 0;
      const newStockTotal = existingStock + qty;
      const totalCostVal = qty * unitCost;

      // Construct history node
      const restockEntry = {
        quantityAdded: qty,
        unitCost,
        totalCost: totalCostVal,
        date: new Date().toISOString(),
        notes: restockNotes || "Standard Inventory Adjustment"
      };

      // Atomic update inside Firestore safely
      await updateDoc(prodRef, {
        stock: newStockTotal,
        unitCost, // Update latest unit cost reference
        restockHistory: arrayUnion(restockEntry)
      });

      toast.success(`Success! Added ${qty} units of "${productObj.name}" to active stock matrix.`);
      setIsRestockOpen(false);
      // Reset inputs
      setRestockQty("");
      setUnitCostInput("");
      setRestockNotes("");
    } catch (err: any) {
      console.error("Restocking action failed:", err);
      toast.error("Process interrupted. Ledger unchanged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencyValue = preferredCurrency || "USD";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Inventory Ledger</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 italic">
            Capital investments, active stock reserves, and manufacturing queues
          </p>
        </div>
        <Button 
          onClick={handleOpenRestockModal}
          className="rounded-xl h-14 px-8 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl hover:scale-[1.02] transition-all w-full md:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" /> Adjust Reserves / Add Stock
        </Button>
      </div>

      {/* Statistics Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Active Stock Value</p>
            <div className="h-10 w-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-950 font-black"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="mt-6">
            <h4 className="text-3xl font-black italic tracking-tighter text-zinc-900">
              {formatCurrency(financialTotals.totalStockValue, currencyValue)}
            </h4>
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Valuation at current price</p>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Total Capital Spent</p>
            <div className="h-10 w-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-950 font-black"><Coins className="h-5 w-5" /></div>
          </div>
          <div className="mt-6">
            <h4 className="text-3xl font-black italic tracking-tighter text-zinc-900">
              {formatCurrency(financialTotals.totalCapitalInvested, currencyValue)}
            </h4>
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Direct production investment</p>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Net Asset Margin</p>
            <div className="h-10 w-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-950 font-black"><Calculator className="h-5 w-5" /></div>
          </div>
          <div className="mt-6">
            <h4 className="text-3xl font-black italic tracking-tighter text-zinc-900">
              {formatCurrency(financialTotals.netValueAfterInvestment, currencyValue)}
            </h4>
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Current unrealized profit margin</p>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Deficit Warnings</p>
            <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-rose-600 font-black">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-3xl font-black italic tracking-tighter text-zinc-900 flex items-baseline gap-2">
              {financialTotals.outOfStockCount} <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">Out</span>
              <span className="text-zinc-300">/</span>
              <span>{financialTotals.lowStockCount}</span> <span className="text-xs font-black uppercase text-zinc-400 tracking-widest font-sans">Low</span>
            </h4>
            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Catalog anomalies needing attention</p>
          </div>
        </Card>
      </div>

      {/* Production Section - Fulfillability Dashboard */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-900"><Play className="h-5 w-5 fill-zinc-900" /></div>
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Manufacturing Queue & Production Status</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1 italic">
                  Aggregate wholesale demands vs active stock reserves. Add investment capital to fulfill pending reserves.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            {productMetrics.filter(p => p.requestedQty > 0).length === 0 ? (
              <div className="py-16 text-center opacity-40">
                <CheckCircle2 className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                <p className="text-xs font-black uppercase italic tracking-widest text-zinc-600">Demands Balanced</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">No outstanding unfulfilled order lines on file.</p>
              </div>
            ) : (
              <div className="border border-zinc-100 rounded-3xl overflow-hidden shadow-inner bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-none h-14">
                      <TableHead className="text-[9px] font-black uppercase tracking-widest px-8">Product Model</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Stock Level</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Wholesale Demand</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Net Surplus/Margin</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Fulfiliation Readiness</TableHead>
                      <TableHead className="w-[180px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productMetrics.filter(p => p.requestedQty > 0).map((prod) => (
                      <TableRow key={prod.id} className="h-20 hover:bg-zinc-50/50 transition-all border-b border-zinc-50">
                        <TableCell className="px-8 font-black uppercase italic text-zinc-900 text-sm tracking-tight">{prod.name}</TableCell>
                        <TableCell className="font-mono text-zinc-600 font-bold">{prod.currentStock} units</TableCell>
                        <TableCell className="font-mono text-zinc-900 font-black">{prod.requestedQty} units</TableCell>
                        <TableCell>
                          <span className={`font-mono font-bold ${prod.deficit > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {prod.deficit > 0 ? `-${prod.deficit} short` : `+${prod.currentStock - prod.requestedQty} margin`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {prod.deficit > 0 ? (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 font-black uppercase text-[8px] tracking-[0.1em] rounded-lg px-4.5 py-1 flex items-center gap-1.5 w-fit border-none">
                              <AlertTriangle className="h-3 w-3" /> Fulfill Blocked: Needs Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-black uppercase text-[8px] tracking-[0.1em] rounded-lg px-4.5 py-1 flex items-center gap-1.5 w-fit border-none">
                              <CheckCircle2 className="h-3 w-3" /> Fulfill Ready
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-8">
                          {prod.deficit > 0 && (
                            <Button 
                              size="sm" 
                              onClick={() => triggerQuickProduction(prod)}
                              className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[9px] h-10 px-4 flex items-center justify-center gap-2"
                            >
                              Add {prod.deficit} Stock <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Inventory & Restock Log split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Catalog Matrix */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
              <Input 
                placeholder="Query catalog models..." 
                className="pl-12 rounded-2xl h-12 border-none bg-white shadow-xl font-bold text-xs uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={stockFilter} onValueChange={(val: any) => setStockFilter(val)}>
              <SelectTrigger className="w-full sm:w-[180px] h-12 bg-white rounded-2xl border-none shadow-xl font-black uppercase text-[10px] tracking-widest px-6 whitespace-nowrap outline-none flex-shrink-0">
                <SelectValue placeholder="Stock Category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-1.5">
                <SelectItem value="all" className="font-bold text-[9px] tracking-widest uppercase">All Catalog</SelectItem>
                <SelectItem value="out" className="font-bold text-[9px] tracking-widest uppercase text-rose-600">Out of Stock</SelectItem>
                <SelectItem value="low" className="font-bold text-[9px] tracking-widest uppercase text-amber-500">Low Stock</SelectItem>
                <SelectItem value="sufficient" className="font-bold text-[9px] tracking-widest uppercase text-emerald-600">Sufficient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 pb-3">
              <CardTitle className="text-base font-black uppercase italic tracking-tighter">Model Inventory reserves</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1 italic">
                Active catalog configurations currently synchronized with database
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-2">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 opacity-50">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-[9px] font-black uppercase tracking-widest italic">Syncing Catalogs...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center opacity-30 select-none">
                  <Package className="h-14 w-14 mx-auto mb-4" />
                  <p className="font-black uppercase italic text-xs tracking-widest">Reserves matrix empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="p-5 bg-zinc-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-100 hover:border-zinc-200 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0">
                          <img src={product.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-black text-zinc-900 uppercase italic text-sm tracking-tight truncate">{product.name}</h5>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Sale Price: {formatCurrency(product.price, product.currency)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
                        <div className="text-right sm:text-right">
                          <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Active Stock</p>
                          <p className={`font-mono font-black text-base italic mt-1.5 ${
                            product.currentStock === 0 ? "text-rose-600 animate-pulse" : 
                            product.currentStock <= 10 ? "text-amber-500" : "text-zinc-900"
                          }`}>
                            {product.currentStock} units
                          </p>
                        </div>

                        <Button 
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setRestockQty("");
                            // Populate latest unitCost if on file, or estimate
                            const cost = (product as any).unitCost || (product.price * 0.5);
                            setUnitCostInput(cost.toFixed(2));
                            setRestockNotes("");
                            setIsRestockOpen(true);
                          }}
                          className="h-10 text-[9px] font-black uppercase tracking-widest px-4 rounded-xl border border-zinc-200 transition-all bg-white hover:bg-zinc-950 hover:text-white hover:border-zinc-950 text-zinc-600 shadow-sm"
                        >
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historic Ledger Area */}
        <div className="lg:col-span-5">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden h-full flex flex-col">
            <CardHeader className="p-8 pb-3">
              <div className="flex items-center gap-2 text-zinc-900">
                <History className="h-5 w-5" />
                <CardTitle className="text-base font-black uppercase italic tracking-tighter">Capital Investment Ledger</CardTitle>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1 italic">Historical cost audits of restocking runs</p>
            </CardHeader>
            <CardContent className="p-8 pt-2 flex-grow">
              {chronologicalHistoryLog.length === 0 ? (
                <div className="py-20 text-center opacity-30 select-none flex flex-col items-center justify-center h-full">
                  <FileText className="h-12 w-12 mb-3" />
                  <p className="font-black uppercase italic text-xs tracking-widest">No entries on registry</p>
                </div>
              ) : (
                <ScrollArea className="h-[430px] pr-2">
                  <div className="space-y-4">
                    {chronologicalHistoryLog.map((log, index) => (
                      <div key={index} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h6 className="font-black text-zinc-900 text-[11px] uppercase tracking-tight italic line-clamp-1">{log.productName}</h6>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                              {new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono font-black text-xs text-zinc-900 italic">-{formatCurrency(log.totalCost, currencyValue)}</p>
                            <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest mt-1">+{log.quantityAdded} units</p>
                          </div>
                        </div>
                        {log.notes && (
                          <p className="text-[9px] font-medium text-zinc-500 italic border-t border-zinc-100/60 pt-2 leading-normal">
                            "{log.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Adjustment Dialog */}
      <Dialog open={isRestockOpen} onOpenChange={(open) => { setIsRestockOpen(open); if(!open) setIsSubmitting(false); }}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          <form onSubmit={handleRestockSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Reserves Calibration</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Add asset inventory stock and update investments cost matrix</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Target Product Model</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                  <SelectTrigger className="rounded-2xl h-14 bg-zinc-50 border-none font-bold uppercase text-xs italic">
                    <SelectValue placeholder="Identify target model..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[10px] tracking-widest">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Quantity to Inject</Label>
                  <Input 
                    required
                    type="number"
                    min="1"
                    placeholder="0"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="h-14 rounded-2xl bg-zinc-50 border-none font-black text-xs text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Unit Investment Cost ({currencyValue})</Label>
                  <Input 
                    required
                    type="number"
                    step="0.01"
                    min="0.00"
                    placeholder="0.00"
                    value={unitCostInput}
                    onChange={(e) => setUnitCostInput(e.target.value)}
                    className="h-14 rounded-2xl bg-zinc-50 border-none font-black text-xs text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Production Run / Ledger Notes</Label>
                <Input 
                  placeholder="QC audit flags, raw materials batch notes..."
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-zinc-900 placeholder:text-zinc-300 px-6 text-xs"
                />
              </div>

              {restockQty && unitCostInput && !isNaN(parseInt(restockQty)) && !isNaN(parseFloat(unitCostInput)) && (
                <div className="p-5 bg-zinc-900 rounded-3xl text-white flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">Calculated Capital Outlay</span>
                  <span className="font-mono text-xl font-black italic tracking-tighter">
                    -{formatCurrency(parseInt(restockQty) * parseFloat(unitCostInput), currencyValue)}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsRestockOpen(false)}
                className="rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] italic"
              >
                Abort
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-2xl h-14 flex-1 font-black uppercase italic tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xl"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...</>
                ) : (
                  "Commit to Ledger"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};
