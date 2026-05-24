import React, { useState, useEffect } from "react";
import { SystemUser, OrderItem, Product } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { CURRENCIES, getCurrencySymbol } from "@/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Package, AlertTriangle } from "lucide-react";

interface NewOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  retailers: SystemUser[];
  employees: SystemUser[];
  products: Product[];
  onSubmit: (data: {
    retailerId: string;
    employeeId: string;
    items: OrderItem[];
    deliveryDate: string;
    totalAmount: number;
    currency: string;
  }) => Promise<void>;
}

export const NewOrderDialog: React.FC<NewOrderDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  retailers, 
  employees, 
  products,
  onSubmit 
}) => {
  const { preferredCurrency } = useAuth();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { name: "", quantity: 1, price: 0 }
  ]);
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [currency, setCurrency] = useState(preferredCurrency || "USD");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preferredCurrency) setCurrency(preferredCurrency);
  }, [preferredCurrency]);

  const grandTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const currentSymbol = getCurrencySymbol(currency);

  const addOrderItem = () => {
    setOrderItems([...orderItems, { name: "", quantity: 1, price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        retailerId: selectedRetailerId,
        employeeId: assignedEmployeeId === "unassigned" ? "" : assignedEmployeeId,
        items: orderItems,
        deliveryDate,
        totalAmount: grandTotal,
        currency
      });
      // Reset
      setOrderItems([{ name: "", quantity: 1, price: 0 }]);
      setSelectedRetailerId("");
      setAssignedEmployeeId("");
      setDeliveryDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                    <Package className="h-6 w-6" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Manifest Genesis</DialogTitle>
                    <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Initialize a new distribution vector</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="grid gap-8">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Target Retailer Node</Label>
                    <Select 
                        value={selectedRetailerId} 
                        onValueChange={setSelectedRetailerId}
                        required
                    >
                        <SelectTrigger className="rounded-2xl h-12 border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                        <SelectValue placeholder="Identify target..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {retailers.map(r => (
                            <SelectItem key={r.uid} value={r.uid} className="font-bold uppercase text-[10px] tracking-widest">{r.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Delivery Timeline</Label>
                    <Input 
                        type="date" 
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        required 
                        className="rounded-2xl h-12 border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Currency Vector</Label>
                    <Select 
                        value={currency} 
                        onValueChange={setCurrency}
                        required
                    >
                        <SelectTrigger className="rounded-2xl h-12 border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                            <SelectValue placeholder="Select currency..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {CURRENCIES.map(c => (
                                <SelectItem key={c.code} value={c.code} className="font-bold uppercase text-[10px] tracking-widest">{c.code} ({c.symbol})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Inventory Units</h3>
                <Button type="button" variant="ghost" size="sm" onClick={addOrderItem} className="rounded-xl h-10 px-4 font-black uppercase text-[9px] tracking-widest hover:bg-zinc-100">
                  <Plus className="h-4 w-4 mr-2" /> Add Component
                </Button>
              </div>

              <div className="border border-zinc-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="h-12 border-none">
                      <TableHead className="w-[40%] text-[9px] font-black uppercase tracking-widest px-6">Product Designation</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Qty</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Unit Price</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest">Calculated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={index} className="h-16 border-b border-zinc-50 group">
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Select
                              value={products.find(p => p.name.toLowerCase() === item.name.toLowerCase())?.id || (item.name ? "custom" : "")}
                              onValueChange={(val) => {
                                if (val === "custom") {
                                  updateOrderItem(index, "name", "");
                                  updateOrderItem(index, "price", 0);
                                } else {
                                  const prod = products.find(p => p.id === val);
                                  if (prod) {
                                    updateOrderItem(index, "name", prod.name);
                                    updateOrderItem(index, "price", prod.price);
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                                <SelectValue placeholder="Identify product catalog..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="custom" className="font-bold text-[10px] tracking-widest text-zinc-400 uppercase">
                                  Custom Item / Enter Manually
                                </SelectItem>
                                {products.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[10px] tracking-widest mb-1">
                                    {p.name} (Stock: {p.stock !== undefined ? p.stock : 0})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Show manual text input if Custom or not matched */}
                            {(!products.find(p => p.name.toLowerCase() === item.name.toLowerCase()) || !item.name) && (
                              <Input 
                                placeholder="Manual Designation" 
                                value={item.name}
                                onChange={(e) => updateOrderItem(index, "name", e.target.value)}
                                className="h-10 rounded-xl border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic"
                                required
                              />
                            )}

                            {/* Show inventory indicator & warnings if matched */}
                            {(() => {
                              const matched = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                              if (matched) {
                                const stock = typeof matched.stock === "number" ? matched.stock : 0;
                                const tooLow = item.quantity > stock;
                                return (
                                  <div className="flex items-center gap-1.5 ml-1">
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${tooLow ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
                                      {tooLow ? `Deficit: ${item.quantity - stock} units short! (Stock: ${stock})` : `In Stock: ${stock} available`}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="px-2">
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 0)}
                            className="h-10 w-16 rounded-xl border-zinc-100 bg-zinc-50 font-black text-xs text-center"
                            required
                          />
                        </TableCell>
                        <TableCell className="px-2">
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            value={item.price}
                            onChange={(e) => updateOrderItem(index, "price", parseFloat(e.target.value) || 0)}
                            className="h-10 w-24 rounded-xl border-zinc-100 bg-zinc-50 font-black text-xs text-center"
                            required
                          />
                        </TableCell>
                        <TableCell className="px-2 font-black italic tracking-tighter text-zinc-900">
                          {currentSymbol}{(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeOrderItem(index)}
                            disabled={orderItems.length === 1}
                            className="h-8 w-8 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-dashed border-zinc-200 pt-8">
                <div className="space-y-4 flex-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Mission Deployment (Optional)</Label>
                    <Select 
                        value={assignedEmployeeId} 
                        onValueChange={setAssignedEmployeeId}
                    >
                        <SelectTrigger className="rounded-2xl h-12 border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                            <SelectValue placeholder="Assign operative..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="unassigned" className="font-bold uppercase text-[10px] tracking-widest">STAY UNASSIGNED</SelectItem>
                            {employees.map(e => (
                                <SelectItem key={e.uid} value={e.uid} className="font-bold uppercase text-[10px] tracking-widest">{e.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 italic">Venture Capital Total ({currency})</p>
                    <p className="text-5xl font-black italic tracking-tighter text-zinc-900">{currentSymbol}{grandTotal.toFixed(2)}</p>
                </div>
            </div>
          </div>
          
          <DialogFooter className="gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic border-zinc-200" onClick={() => onOpenChange(false)}>Abort Mission</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic bg-zinc-900 text-white hover:bg-zinc-800 shadow-2xl">
                {isSubmitting ? "PROCESSING..." : "ACTIVATE MANIFEST"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
