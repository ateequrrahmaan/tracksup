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
import { toast } from "sonner";
import { UNIT_DEFINITIONS, formatStock, convertToSmallestUnit, convertFromSmallestUnit, findUnitDefinition } from "@/lib/measurements";

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
  const [orderItems, setOrderItems] = useState<(OrderItem & { productId?: string; selectedUnit?: string; displayQuantity?: number })[]>([
    { productId: "", name: "", quantity: 1, price: 0, selectedUnit: "Piece", displayQuantity: 1 }
  ]);
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [currency, setCurrency] = useState(preferredCurrency || "USD");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preferredCurrency) setCurrency(preferredCurrency);
  }, [preferredCurrency]);

  // Clean reset when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setOrderItems([{ productId: "", name: "", quantity: 1, price: 0, selectedUnit: "Piece", displayQuantity: 1 }]);
      setSelectedRetailerId("");
      setAssignedEmployeeId("");
      setDeliveryDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const grandTotal = orderItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    const prod = products.find(p => p.id === item.productId);
    const baseUnitDef = findUnitDefinition(prod?.baseUnit || "Piece");
    const orderedUnitDef = findUnitDefinition(item.selectedUnit || "Piece");
    const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
    const linePrice = (item.displayQuantity ?? item.quantity) * multiplierRatio * item.price;
    return sum + linePrice;
  }, 0);

  const currentSymbol = getCurrencySymbol(currency);

  const getProductStockStatus = (prodId: string, currentIndex: number) => {
    const prod = products.find(p => p.id === prodId);
    const stock = prod ? (typeof prod.stock === "number" ? prod.stock : 0) : 0;
    const allocatedInOtherRows = orderItems.reduce((sum, item, idx) => {
      if (idx !== currentIndex && item.productId === prodId) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
    const remaining = Math.max(0, stock - allocatedInOtherRows);
    return { stock, allocatedInOtherRows, remaining };
  };

  const addOrderItem = () => {
    if (orderItems.length >= products.length) {
      toast.error("All product catalog items have already been allocated.");
      return;
    }
    if (products.length > 0) {
      const allDepleted = products.every(p => {
        const { remaining } = getProductStockStatus(p.id, -1);
        return remaining <= 0;
      });
      if (allDepleted) {
        toast.error("Deficit warning: All physical inventory units from your catalog are fully allocated in this configuration.");
        return;
      }
    }
    setOrderItems([...orderItems, { productId: "", name: "", quantity: 1, price: 0, selectedUnit: "Piece", displayQuantity: 1 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, updates: Partial<OrderItem & { productId?: string; selectedUnit?: string; displayQuantity?: number }>) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId) {
      toast.error("Please select a target retailer node.");
      return;
    }

    if (orderItems.length === 0 || orderItems.some(item => !item.name)) {
      toast.error("Please add and identify at least one product catalog entry.");
      return;
    }

    // Check for duplicates
    const productNames = orderItems.map(item => item.name.toLowerCase().trim());
    const uniqueProductNames = new Set(productNames);
    if (productNames.length !== uniqueProductNames.size) {
      toast.error("Duplicate products selected. Please adjust quantities of existing items instead of adding multiple rows for the same product.");
      return;
    }

    // Validate stock constraints
    for (const item of orderItems) {
      const matched = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (matched) {
        const stock = typeof matched.stock === "number" ? matched.stock : 0;
        if (item.quantity > stock) {
          const formattedStock = formatStock(stock, matched.measurementType, matched.baseUnit);
          const formattedReqQuantity = formatStock(item.quantity, matched.measurementType, matched.baseUnit);
          toast.error(`Deficit: Only ${formattedStock} of "${matched.name}" available in stock (Requested: ${formattedReqQuantity}). Please restock before organizing this shipment.`);
          return;
        }
      } else {
        toast.error(`Could not locate product: ${item.name} in master catalog.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Remove local productId before submitting items to backend service
      const cleanItems: any[] = orderItems.map(({ name, quantity, price, selectedUnit, displayQuantity }) => ({
        name,
        quantity, // smallest units for backend stock deduction
        price,
        unit: selectedUnit || "Piece",
        displayQty: displayQuantity ?? quantity
      }));

      await onSubmit({
        retailerId: selectedRetailerId,
        employeeId: assignedEmployeeId === "unassigned" ? "" : assignedEmployeeId,
        items: cleanItems,
        deliveryDate,
        totalAmount: grandTotal,
        currency
      });
      // Reset
      setOrderItems([{ productId: "", name: "", quantity: 1, price: 0, selectedUnit: "Piece", displayQuantity: 1 }]);
      setSelectedRetailerId("");
      setAssignedEmployeeId("");
      setDeliveryDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 border-none shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6" />
                </div>
                <div>
                    <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">Manifest Genesis</DialogTitle>
                    <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Initialize a new distribution vector</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="grid gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
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

              {/* Desktop Table View: visible on md and up */}
              <div className="hidden md:block border border-zinc-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="h-12 border-none">
                      <TableHead className="w-[35%] text-[9px] font-black uppercase tracking-widest px-6">Product Designation</TableHead>
                      <TableHead className="w-[18%] text-[9px] font-black uppercase tracking-widest">Qty</TableHead>
                      <TableHead className="w-[18%] text-[9px] font-black uppercase tracking-widest">Unit</TableHead>
                      <TableHead className="w-[14%] text-[9px] font-black uppercase tracking-widest">Unit Price</TableHead>
                      <TableHead className="w-[15%] text-[9px] font-black uppercase tracking-widest">Calculated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => {
                      const selectedProd = products.find(p => p.id === item.productId);
                      const normMType = selectedProd 
                        ? (selectedProd.measurementType === "Weight Based" || selectedProd.measurementType === "weight" ? "weight" : selectedProd.measurementType === "Volume Based" || selectedProd.measurementType === "volume" ? "volume" : "count")
                        : "count";
                      const compatibleUnits = UNIT_DEFINITIONS.filter(u => u.type === normMType);
                      const baseUnitDef = findUnitDefinition(selectedProd?.baseUnit || "Piece");
                      const orderedUnitDef = findUnitDefinition(item.selectedUnit || "Piece");
                      const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
                      const linePrice = (item.displayQuantity ?? item.quantity) * multiplierRatio * item.price;

                      return (
                        <TableRow key={index} className="h-16 border-b border-zinc-50 group">
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              <Select
                                value={item.productId || ""}
                                onValueChange={(val) => {
                                  const prod = products.find(p => p.id === val);
                                  if (prod) {
                                    const defaultUnit = prod.baseUnit || "Piece";
                                    updateOrderItem(index, {
                                      productId: prod.id,
                                      name: prod.name,
                                      price: prod.price,
                                      selectedUnit: defaultUnit,
                                      displayQuantity: 1,
                                      quantity: convertToSmallestUnit(1, defaultUnit)
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-10 rounded-xl border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                                  {item.name ? (
                                    <span className="truncate">{item.name}</span>
                                  ) : (
                                    <SelectValue placeholder="Identify product catalog..." />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                  {products.map(p => {
                                    const { remaining } = getProductStockStatus(p.id, index);
                                    const isAlreadySelected = orderItems.some((ot, idx) => idx !== index && ot.productId === p.id);
                                    const isDisabled = (remaining <= 0 || isAlreadySelected) && item.productId !== p.id;
                                    const formattedRemaining = formatStock(remaining, p.measurementType, p.baseUnit);
                                    return (
                                      <SelectItem 
                                        key={p.id} 
                                        value={p.id} 
                                        disabled={isDisabled}
                                        className={`font-bold uppercase text-[10px] tracking-widest mb-1 ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                      >
                                        {p.name} {isAlreadySelected ? "(Already Selected)" : `(Remaining: ${formattedRemaining})`}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
   
                              {/* Show inventory indicator & warnings if matched */}
                              {(() => {
                                const matched = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                                if (matched) {
                                  const { remaining } = getProductStockStatus(matched.id, index);
                                  const formattedStock = formatStock(remaining, matched.measurementType, matched.baseUnit);
                                  const isDeficit = item.quantity > remaining;
                                  return (
                                    <div className="flex items-center gap-1.5 ml-1">
                                      <span className={`text-[9px] font-black uppercase tracking-wider ${isDeficit ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
                                        {isDeficit ? "Exceeds Allocated Buffer Stock!" : `Live Stock Buffer: ${formattedStock}`}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            {(() => {
                              const { remaining } = getProductStockStatus(item.productId || "", index);
                              const orderedUnitDef = findUnitDefinition(item.selectedUnit || "Piece");
                              const allowedDisplay = convertFromSmallestUnit(remaining, orderedUnitDef.name);
                              return (
                                <Input 
                                  type="number" 
                                  step="any"
                                  min="0.001"
                                  placeholder="0"
                                  value={item.displayQuantity ?? item.quantity}
                                  onChange={(e) => {
                                    const rawVal = parseFloat(e.target.value);
                                    const val = isNaN(rawVal) || rawVal <= 0 ? 0 : rawVal;
                                    const compSmall = convertToSmallestUnit(val, item.selectedUnit || "Piece");
                                    
                                    if (compSmall > remaining) {
                                      toast.error(`Exceeded available stock! Max allowed: ${allowedDisplay} ${item.selectedUnit}`);
                                      updateOrderItem(index, { 
                                        displayQuantity: allowedDisplay,
                                        quantity: remaining
                                      });
                                    } else {
                                      updateOrderItem(index, { 
                                        displayQuantity: val,
                                        quantity: compSmall
                                      });
                                    }
                                  }}
                                  className="h-10 w-24 rounded-xl border-zinc-100 bg-zinc-50 font-black text-xs text-center"
                                  required
                                  disabled={!item.productId}
                                />
                              );
                            })()}
                          </TableCell>
                          <TableCell className="px-2">
                            <Select
                              value={item.selectedUnit || "Piece"}
                              onValueChange={(newUnit) => {
                                const currentDisp = item.displayQuantity ?? 1;
                                const compSmall = convertToSmallestUnit(currentDisp, newUnit);
                                const { remaining } = getProductStockStatus(item.productId || "", index);
                                
                                if (compSmall > remaining) {
                                  const allowedDisplay = convertFromSmallestUnit(remaining, newUnit);
                                  toast.error(`Exceeded available stock! Max allowed: ${allowedDisplay} ${newUnit}`);
                                  updateOrderItem(index, {
                                    selectedUnit: newUnit,
                                    displayQuantity: allowedDisplay,
                                    quantity: remaining
                                  });
                                } else {
                                  updateOrderItem(index, {
                                    selectedUnit: newUnit,
                                    quantity: compSmall
                                  });
                                }
                              }}
                              disabled={!item.productId}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-zinc-100 bg-zinc-50 font-bold uppercase text-xs italic">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-none shadow-2xl">
                                {compatibleUnits.map(unit => (
                                  <SelectItem key={unit.name} value={unit.name} className="font-bold uppercase text-[9px] tracking-widest py-2">
                                    {unit.name} ({unit.abbreviation})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="px-2">
                            <Input 
                              type="number" 
                              step="any" 
                              value={item.price}
                              readOnly
                              disabled
                              className="h-10 w-20 rounded-xl border-zinc-100 bg-zinc-100 font-black text-xs text-center text-zinc-500 cursor-not-allowed"
                              required
                            />
                          </TableCell>
                          <TableCell className="px-2 font-black italic tracking-tighter text-zinc-900 text-sm">
                            {currentSymbol}{linePrice.toFixed(2)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
 
              {/* Mobile Card Stack View: visible below md */}
              <div className="block md:hidden space-y-4">
                {orderItems.map((item, index) => {
                  const selectedProd = products.find(p => p.id === item.productId);
                  const normMType = selectedProd 
                    ? (selectedProd.measurementType === "Weight Based" || selectedProd.measurementType === "weight" ? "weight" : selectedProd.measurementType === "Volume Based" || selectedProd.measurementType === "volume" ? "volume" : "count")
                    : "count";
                  const compatibleUnits = UNIT_DEFINITIONS.filter(u => u.type === normMType);
                  const baseUnitDef = findUnitDefinition(selectedProd?.baseUnit || "Piece");
                  const orderedUnitDef = findUnitDefinition(item.selectedUnit || "Piece");
                  const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
                  const linePrice = (item.displayQuantity ?? item.quantity) * multiplierRatio * item.price;

                  return (
                    <div key={index} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 italic">Component #{index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeOrderItem(index)}
                          disabled={orderItems.length === 1}
                          className="h-8 w-8 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
 
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Product Designation</Label>
                        <Select
                          value={item.productId || ""}
                          onValueChange={(val) => {
                            const prod = products.find(p => p.id === val);
                            if (prod) {
                              const defaultUnit = prod.baseUnit || "Piece";
                              updateOrderItem(index, {
                                productId: prod.id,
                                name: prod.name,
                                price: prod.price,
                                selectedUnit: defaultUnit,
                                displayQuantity: 1,
                                quantity: convertToSmallestUnit(1, defaultUnit)
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-white font-bold uppercase text-xs italic">
                            {item.name ? (
                              <span className="truncate">{item.name}</span>
                            ) : (
                              <SelectValue placeholder="Identify catalog..." />
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {products.map(p => {
                              const { remaining } = getProductStockStatus(p.id, index);
                              const isAlreadySelected = orderItems.some((ot, idx) => idx !== index && ot.productId === p.id);
                              const isDisabled = (remaining <= 0 || isAlreadySelected) && item.productId !== p.id;
                              const formattedRemaining = formatStock(remaining, p.measurementType, p.baseUnit);
                              return (
                                <SelectItem 
                                  key={p.id} 
                                  value={p.id} 
                                  disabled={isDisabled}
                                  className={`font-bold uppercase text-[10px] tracking-widest mb-1 ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                >
                                  {p.name} {isAlreadySelected ? "(Already Selected)" : `(Remaining: ${formattedRemaining})`}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        
                        {/* Show inventory indicator & warnings if matched */}
                        {(() => {
                          const matched = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                          if (matched) {
                            const { remaining } = getProductStockStatus(matched.id, index);
                            const formattedStock = formatStock(remaining, matched.measurementType, matched.baseUnit);
                            const isDeficit = item.quantity > remaining;
                            return (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isDeficit ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
                                  {isDeficit ? "Exceeds Stock Matrix Capacity!" : `Stock Buffer: ${formattedStock}`}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
 
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[9px] font-black uppercase text-zinc-500">Qty</Label>
                          {(() => {
                            const { remaining } = getProductStockStatus(item.productId || "", index);
                            const orderedUnitDef = findUnitDefinition(item.selectedUnit || "Piece");
                            const allowedDisplay = convertFromSmallestUnit(remaining, orderedUnitDef.name);
                            return (
                              <Input 
                                type="number" 
                                step="any"
                                min="0.001"
                                value={item.displayQuantity ?? item.quantity}
                                onChange={(e) => {
                                  const rawVal = parseFloat(e.target.value);
                                  const val = isNaN(rawVal) || rawVal <= 0 ? 0 : rawVal;
                                  const compSmall = convertToSmallestUnit(val, item.selectedUnit || "Piece");
                                  
                                  if (compSmall > remaining) {
                                    toast.error(`Exceeded stock! Max allowed: ${allowedDisplay} ${item.selectedUnit}`);
                                    updateOrderItem(index, { 
                                      displayQuantity: allowedDisplay,
                                      quantity: remaining
                                    });
                                  } else {
                                    updateOrderItem(index, { 
                                      displayQuantity: val,
                                      quantity: compSmall
                                    });
                                  }
                                }}
                                className="h-10 rounded-xl border-zinc-100 bg-white font-black text-xs text-center"
                                required
                                disabled={!item.productId}
                              />
                            );
                          })()}
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[9px] font-black uppercase text-zinc-500">Unit</Label>
                          <Select
                            value={item.selectedUnit || "Piece"}
                            onValueChange={(newUnit) => {
                              const currentDisp = item.displayQuantity ?? 1;
                              const compSmall = convertToSmallestUnit(currentDisp, newUnit);
                              const { remaining } = getProductStockStatus(item.productId || "", index);
                              
                              if (compSmall > remaining) {
                                const allowedDisplay = convertFromSmallestUnit(remaining, newUnit);
                                toast.error(`Exceeded stock! Max: ${allowedDisplay} ${newUnit}`);
                                updateOrderItem(index, {
                                  selectedUnit: newUnit,
                                  displayQuantity: allowedDisplay,
                                  quantity: remaining
                                });
                              } else {
                                updateOrderItem(index, {
                                  selectedUnit: newUnit,
                                  quantity: compSmall
                                });
                              }
                            }}
                            disabled={!item.productId}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-zinc-100 bg-white font-bold uppercase text-[10px] italic">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                              {compatibleUnits.map(unit => (
                                <SelectItem key={unit.name} value={unit.name} className="font-bold uppercase text-[9px] tracking-widest py-2">
                                  {unit.name} ({unit.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100/50">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-zinc-500">Unit Price</Label>
                          <Input 
                            type="number" 
                            step="any" 
                            value={item.price}
                            readOnly
                            disabled
                            className="h-10 rounded-xl border-zinc-100 bg-zinc-100 font-black text-xs text-center text-zinc-500 cursor-not-allowed"
                            required
                          />
                        </div>
                        <div className="space-y-1 text-center">
                          <Label className="text-[9px] font-black uppercase text-zinc-500 block">Calculated</Label>
                          <div className="h-10 flex items-center justify-center font-black italic text-xs text-zinc-900 bg-white border border-zinc-100 rounded-xl">
                            {currentSymbol}{linePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <p className="text-3xl sm:text-5xl font-black italic tracking-tighter text-zinc-900">{currentSymbol}{grandTotal.toFixed(2)}</p>
                </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
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
