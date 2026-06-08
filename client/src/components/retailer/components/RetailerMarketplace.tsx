import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/lib/auth-context";
import { Product, OrderItem, Organization } from "@/types";
import { formatCurrency } from "@/constants";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, ShoppingCart, Loader2, Package, Store, CheckCircle2, AlertCircle, Filter, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  UNIT_DEFINITIONS, 
  formatStock, 
  convertFromSmallestUnit, 
  convertToSmallestUnit, 
  findUnitDefinition 
} from "@/lib/measurements";

interface RetailerMarketplaceProps {
  initialSupplierId?: string | null;
}

interface CartItem {
  id: string; // product ID
  productId?: string;
  name: string;
  price: number; // base price
  currency: string;
  imageUrl?: string;
  supplierId: string;
  supplierName: string;
  quantity: number; // store in smallest unit (e.g. Gram, ML, Piece) for delivery stock check
  unit: string; // selected unit name (e.g. Kilogram, Gram, Liter, ML, Piece)
  baseUnit: string; // base unit name
  displayQty: number; // numeric fractional value (e.g. 1.25)
  measurementType?: string;
  stock?: number; // available stock in smallest unit
}

export const RetailerMarketplace: React.FC<RetailerMarketplaceProps> = ({ initialSupplierId }) => {
  const { memberships, activeOrg, user, activeRole, preferredCurrency } = useAuth();
  const [products, setProducts] = useState<(Product & { supplierName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId || activeOrg?.id || "all");
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const cartKey = user ? `tracksup_cart_${user.uid}_${activeOrg?.id || 'personal'}` : null;
  const loadedKeyRef = React.useRef<string | null>(null);

  // Modal State for custom purchases
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchaseProduct, setSelectedPurchaseProduct] = useState<(Product & { supplierName: string }) | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseUnit, setPurchaseUnit] = useState("Piece");

  useEffect(() => {
    if (cartKey) {
      try {
        const savedCart = localStorage.getItem(cartKey);
        setCart(savedCart ? JSON.parse(savedCart) : {});
        loadedKeyRef.current = cartKey;
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
        setCart({});
      }
    }
  }, [cartKey]);

  useEffect(() => {
    if (cartKey && loadedKeyRef.current === cartKey) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, cartKey]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConnectedProducts();
  }, [memberships]);

  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    } else if (activeOrg?.id) {
      // Always sync with activeOrg if it changes, unless we have an initial override
      setSelectedSupplierId(activeOrg.id);
    }
  }, [initialSupplierId, activeOrg?.id]);

  const fetchConnectedProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/products/marketplace");
      const marketplaceProducts = response.data.data;
      
      const supplierMap = new Map<string, string>();
      marketplaceProducts.forEach((p: any) => {
        if (!supplierMap.has(p.supplierId)) {
          supplierMap.set(p.supplierId, p.supplierName);
        }
      });

      setProducts(marketplaceProducts);
      setSuppliers(Array.from(supplierMap.entries()).map(([id, name]) => ({ id, name })));
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      toast.error("Error loading marketplace.");
    } finally {
      setLoading(false);
    }
  };

  const getCompatibleUnits = (product?: Product) => {
    if (!product) return [];
    const mType = product.measurementType || "Count Based";
    const normType = (mType === "Count Based" || mType === "count") 
      ? "count" 
      : (mType === "Weight Based" || mType === "weight") 
      ? "weight" 
      : (mType === "Volume Based" || mType === "volume") 
      ? "volume" 
      : "count";
    return UNIT_DEFINITIONS.filter(u => u.type === normType);
  };

  const getPurchaseCalculations = () => {
    if (!selectedPurchaseProduct) return { multiplierRatio: 1, linePrice: 0, requestedSmallest: 0, exceedsStock: false };
    
    const prod = selectedPurchaseProduct;
    const baseUnitDef = findUnitDefinition(prod.baseUnit || "Piece");
    const orderedUnitDef = findUnitDefinition(purchaseUnit || prod.baseUnit || "Piece");
    const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
    const enteredQty = parseFloat(purchaseQuantity) || 0;
    
    const linePrice = enteredQty * multiplierRatio * prod.price;
    const requestedSmallest = convertToSmallestUnit(enteredQty, purchaseUnit);

    const exceedsStock = prod.stock !== undefined && requestedSmallest > prod.stock;
    
    return {
      multiplierRatio,
      linePrice,
      requestedSmallest,
      exceedsStock
    };
  };

  const openPurchaseModal = (product: Product & { supplierName: string }) => {
    setSelectedPurchaseProduct(product);
    const existing = cart[product.id];
    if (existing) {
      setPurchaseQuantity(existing.displayQty.toString());
      setPurchaseUnit(existing.unit);
    } else {
      setPurchaseQuantity("1");
      setPurchaseUnit(product.baseUnit || "Piece");
    }
    setIsPurchaseModalOpen(true);
  };

  const submitPurchaseToCart = () => {
    if (!selectedPurchaseProduct) return;
    const prod = selectedPurchaseProduct;
    const qtyVal = parseFloat(purchaseQuantity) || 0;
    
    if (qtyVal <= 0 || isNaN(qtyVal)) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    const { requestedSmallest, exceedsStock } = getPurchaseCalculations();
    
    if (exceedsStock) {
      toast.error(`Supply deficit: Only ${formatStock(prod.stock, prod.measurementType, prod.baseUnit)} available. You requested ${formatStock(requestedSmallest, prod.measurementType, prod.baseUnit)}.`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [prod.id]: {
        id: prod.id,
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        currency: prod.currency || preferredCurrency,
        imageUrl: prod.imageUrl,
        supplierId: prod.supplierId,
        supplierName: prod.supplierName,
        quantity: requestedSmallest,
        unit: purchaseUnit,
        baseUnit: prod.baseUnit || "Piece",
        displayQty: qtyVal,
        measurementType: prod.measurementType || "Count Based",
        stock: prod.stock
      }
    }));
    
    toast.success(`Loaded ${qtyVal} ${purchaseUnit} of ${prod.name} into your bag.`);
    setIsPurchaseModalOpen(false);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const { [productId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const cartItems: CartItem[] = Object.values(cart);
  
  const cartTotal = cartItems.reduce((sum, item) => {
    const baseUnitDef = findUnitDefinition(item.baseUnit || "Piece");
    const orderedUnitDef = findUnitDefinition(item.unit || "Piece");
    const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
    return sum + (item.displayQty * multiplierRatio * item.price);
  }, 0);

  const cartCurrency = cartItems[0]?.currency || preferredCurrency;

  const handleCheckout = async () => {
    console.log("[Marketplace] Attempting checkout", { cartItems, activeOrg, user });
    
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    // Relaxed requirement: if no activeOrg, we treat the user as a personal retailer
    if (!activeOrg) {
      console.warn("[Marketplace] No active organization selected, ordering as personal user.");
    }

    setIsSubmitting(true);
    try {
      // Group items by supplierId
      const groupedBySupplier = new Map<string, CartItem[]>();
      cartItems.forEach(item => {
        const items = groupedBySupplier.get(item.supplierId) || [];
        items.push(item);
        groupedBySupplier.set(item.supplierId, items);
      });

      console.log("[Marketplace] Groups:", Array.from(groupedBySupplier.keys()));

      // Place an order for each supplier
      const orderPromises = Array.from(groupedBySupplier.entries()).map(([supplierId, items]) => {
        const supplierName = items[0].supplierName;
        const totalAmount = items.reduce((sum, item) => {
          const baseUnitDef = findUnitDefinition(item.baseUnit || "Piece");
          const orderedUnitDef = findUnitDefinition(item.unit || "Piece");
          const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
          return sum + (item.displayQty * multiplierRatio * item.price);
        }, 0);
        
        const isMemberOfSupplier = activeOrg?.id === supplierId;
        const retailerId = isMemberOfSupplier ? user!.uid : (activeOrg?.id || user!.uid);
        const retailerName = isMemberOfSupplier ? user!.name : (activeOrg?.name || user!.name);

        console.log(`[Marketplace] Placing order to ${supplierId} as ${retailerId}`);

        return api.post("/orders", {
          supplierId,
          supplierName,
          retailerId,
          retailerName,
          totalAmount,
          currency: items[0].currency,
          items: items.map(p => ({
            productId: p.id,
            name: p.name,
            quantity: p.quantity, // smallest unit for stock management
            price: p.price, // original base price per base unit
            unit: p.unit, // e.g. "Kilogram", "Gram"
            displayQty: p.displayQty, // e.g. 1.25
            baseUnit: p.baseUnit // standard base unit
          })),
          deliveryDate: new Date().toISOString().split('T')[0],
          payment_status: "unpaid",
        });
      });

      await Promise.all(orderPromises);

      toast.success("All orders placed successfully!");
      setCart({});
      if (cartKey) {
        localStorage.removeItem(cartKey);
      }
      setIsCartOpen(false);
    } catch (error: any) {
      console.error("Error placing orders:", error);
      const message = error.response?.data?.error?.message || "Failed to place orders.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = selectedSupplierId === "all" || p.supplierId === selectedSupplierId;
    return matchesSearch && matchesSupplier;
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Marketplace</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 italic">
            Browse and order products from your connected suppliers
          </p>
        </div>

        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger 
            render={
              <Button className="rounded-2xl h-14 px-8 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-2xl hover:scale-105 transition-all relative">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Cart
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] h-6 w-6 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-in zoom-in duration-300">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent className="w-full sm:max-w-md rounded-l-[3rem] border-none shadow-2xl p-0 flex flex-col">
            <SheetHeader className="p-10 pb-6">
              <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                Your Bag <ShoppingBag className="h-8 w-8" />
              </SheetTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Review your items before ordering</p>
            </SheetHeader>

            <ScrollArea className="flex-1 px-10">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                  <ShoppingBag className="h-20 w-20 mx-auto mb-4" />
                  <p className="font-black uppercase italic tracking-widest text-xs">Your bag is empty</p>
                </div>
              ) : (
                <div className="space-y-8 pb-10">
                  {cartItems.map(item => {
                    const baseUnitDef = findUnitDefinition(item.baseUnit || "Piece");
                    const orderedUnitDef = findUnitDefinition(item.unit || "Piece");
                    const multiplierRatio = orderedUnitDef.multiplier / baseUnitDef.multiplier;
                    const linePrice = item.displayQty * multiplierRatio * item.price;
                    return (
                      <div key={item.id} className="group relative flex items-center gap-6 p-4 rounded-3xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100">
                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0">
                          <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge className="bg-zinc-100 text-zinc-900 text-[8px] font-black uppercase tracking-widest rounded-lg px-2 mb-1">
                            {item.supplierName}
                          </Badge>
                          <h5 className="font-black uppercase italic tracking-tight truncate text-sm">{item.name}</h5>
                          <p className="text-[10px] font-bold text-zinc-500 mt-1">
                            Rate: {formatCurrency(item.price, item.currency || preferredCurrency)} / {item.baseUnit || "Piece"}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-3">
                            <button 
                              onClick={() => {
                                const prod = products.find(p => p.id === item.id);
                                if (prod) openPurchaseModal(prod);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 transition-colors"
                            >
                              Edit Flow
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {item.displayQty} {item.unit || "Piece"}
                          </p>
                          <p className="font-black italic text-sm tracking-tighter mt-1">
                            {formatCurrency(linePrice, item.currency || preferredCurrency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="p-10 bg-zinc-50 border-t border-zinc-100">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-black italic">
                    {formatCurrency(cartTotal, cartCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-900 pt-4 border-t border-zinc-200">
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black italic tracking-tighter">
                    {formatCurrency(cartTotal, cartCurrency)}
                  </span>
                </div>
              </div>
              <Button 
                disabled={cartItems.length === 0 || isSubmitting}
                onClick={handleCheckout}
                className="w-full h-16 rounded-[2rem] bg-zinc-900 text-white font-black uppercase italic tracking-widest text-sm hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Orders...</>
                ) : (
                  <>Place Combined Order <ShoppingBag className="ml-3 h-5 w-5" /></>
                )}
              </Button>
              <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center leading-relaxed italic">
                Orders will be grouped by supplier and placed separately.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <Input 
            placeholder="Search products..." 
            className="pl-14 rounded-2xl h-14 border-none bg-white shadow-xl font-black text-xs uppercase italic tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
          <SelectTrigger className="w-full lg:w-[300px] h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest text-zinc-900 px-8 outline-none">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-zinc-400" />
              <SelectValue placeholder="Select Supplier" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl p-2 max-w-[320px]">
            <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">All Suppliers</SelectItem>
            {suppliers.map(supplier => (
              <SelectItem key={supplier.id} value={supplier.id} className="font-black uppercase text-[9px] tracking-widest py-3 truncate">
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
          <p className="text-[10px] font-black uppercase tracking-widest italic tracking-tighter">Loading Products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white flex flex-col h-full">
              <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 flex-wrap pointer-events-none">
                  <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 rounded-lg border-none shadow-sm pointer-events-auto">
                    {product.supplierName}
                  </Badge>
                  <div className="pointer-events-auto">
                    {product.stock !== undefined ? (
                      product.stock > 0 ? (
                        <Badge className="bg-emerald-500/90 backdrop-blur-md text-white font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1.5 rounded-lg border-none shadow-sm flex items-center gap-1.5 font-bold">
                          <Package className="h-3 w-3" /> Stock: {formatStock(product.stock, product.measurementType, product.baseUnit)}
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/90 backdrop-blur-md text-white font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1.5 rounded-lg border-none shadow-sm flex items-center gap-1.5 animate-pulse font-bold">
                          <AlertCircle className="h-3 w-3" /> Out of Stock
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-emerald-500/90 backdrop-blur-md text-white font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1.5 rounded-lg border-none shadow-sm flex items-center gap-1.5 font-bold">
                        <Package className="h-3 w-3" /> Available
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 animate-in fade-in">
                  <Badge className="bg-zinc-900/80 backdrop-blur-md text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-xl border-none font-bold">
                    {formatCurrency(product.price, product.currency || preferredCurrency)} / {product.baseUnit || "Piece"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-black uppercase italic tracking-tighter truncate">{product.name}</h4>
                  <p className="text-[10px] font-medium text-zinc-500 mt-2 line-clamp-2 leading-relaxed h-10">
                    {product.description || "Product available for order."}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">
                   <Button 
                    onClick={() => openPurchaseModal(product)}
                    disabled={product.stock !== undefined && product.stock <= 0}
                    className="w-full rounded-2xl h-12 font-black uppercase italic tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all text-[10px] disabled:opacity-50 disabled:hover:scale-100"
                   >
                     {product.stock !== undefined && product.stock <= 0 ? (
                       "Out of Stock"
                     ) : cart[product.id] ? (
                       <>Edit Choice <Plus className="ml-2 h-4 w-4" /></>
                     ) : (
                       <>Select & Purchase <Plus className="ml-2 h-4 w-4" /></>
                     )}
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center flex flex-col items-center justify-center opacity-30 select-none">
          <Store className="h-20 w-20 mb-6 animate-pulse" />
          <h4 className="text-xl font-black uppercase italic tracking-tighter">No Products Found</h4>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Connect with suppliers to see their products here.</p>
        </div>
      )}

      {/* Product Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">
              {cart[selectedPurchaseProduct?.id || ""] ? "Modify Choice" : "Purchase Component"}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Set custom billing specs and check stock limits live
            </DialogDescription>
          </DialogHeader>

          {selectedPurchaseProduct && (
            <div className="space-y-6 mt-4">
              {/* Product Info Display Card */}
              <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-3xl border border-zinc-100">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0">
                  <img 
                    src={selectedPurchaseProduct.imageUrl} 
                    alt={selectedPurchaseProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge className="bg-zinc-200 text-zinc-850 text-[8px] font-bold uppercase mb-1">
                    {selectedPurchaseProduct.supplierName}
                  </Badge>
                  <h4 className="font-black uppercase text-sm text-zinc-900 truncate leading-tight">
                    {selectedPurchaseProduct.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                    Catalog Price: {formatCurrency(selectedPurchaseProduct.price, selectedPurchaseProduct.currency || preferredCurrency)} / {selectedPurchaseProduct.baseUnit || "Piece"}
                  </p>
                </div>
              </div>

              {/* Key Stock Level Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Catalog Stock</span>
                  <span className="text-xs font-black text-zinc-800 mt-1">
                    {formatStock(selectedPurchaseProduct.stock, selectedPurchaseProduct.measurementType, selectedPurchaseProduct.baseUnit)}
                  </span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Measurement Mode</span>
                  <span className="text-xs font-black text-indigo-700 uppercase mt-1">
                    {selectedPurchaseProduct.measurementType || "Count Based"}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Specify Quantity</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      placeholder="e.g. 1.25 or 250"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(e.target.value)}
                      className="h-11 text-xs font-black bg-zinc-50/50 border-zinc-150 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Unit</Label>
                    <Select value={purchaseUnit} onValueChange={setPurchaseUnit}>
                      <SelectTrigger className="h-11 bg-zinc-50/50 border-zinc-150 rounded-xl font-bold uppercase text-[10px] tracking-wider text-zinc-900 px-3 outline-none">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl p-2 bg-white">
                        {getCompatibleUnits(selectedPurchaseProduct).map((u) => (
                          <SelectItem key={u.name} value={u.name} className="font-bold text-[10px] uppercase py-2">
                            {u.abbreviation || u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subtitle examples block */}
                <div className="text-[9px] text-zinc-400 leading-relaxed font-bold italic px-1">
                  * Support examples: 250g (0.25 KG), 750g (0.75 KG), 1.250kg, 1.5L, 12 pieces if compatible.
                </div>
              </div>

              {/* Calculations and Stock Warnings */}
              {(() => {
                const { linePrice, requestedSmallest, exceedsStock } = getPurchaseCalculations();
                return (
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Live Subtotal</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                          At {formatCurrency(linePrice / (parseFloat(purchaseQuantity) || 1), selectedPurchaseProduct.currency || preferredCurrency)} / {purchaseUnit}
                        </p>
                      </div>
                      <p className="text-2xl font-black italic text-zinc-900 tracking-tighter">
                        {formatCurrency(linePrice, selectedPurchaseProduct.currency || preferredCurrency)}
                      </p>
                    </div>

                    {exceedsStock && (
                      <div className="flex items-center gap-2 bg-red-50 text-red-700 text-[10px] font-black uppercase p-3 rounded-2xl border border-red-100 leading-relaxed">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          Warning: Available stock level is only {formatStock(selectedPurchaseProduct.stock, selectedPurchaseProduct.measurementType, selectedPurchaseProduct.baseUnit)}. Desired quantity is {formatStock(requestedSmallest, selectedPurchaseProduct.measurementType, selectedPurchaseProduct.baseUnit)}.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="mt-8 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-wider text-zinc-500"
            >
              Cancel
            </Button>
            {(() => {
              const { linePrice, exceedsStock } = getPurchaseCalculations();
              return (
                <Button
                  disabled={exceedsStock || !purchaseQuantity || parseFloat(purchaseQuantity) <= 0 || isNaN(parseFloat(purchaseQuantity))}
                  onClick={submitPurchaseToCart}
                  className="rounded-2xl h-12 px-6 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-lg flex-1 text-[10px]"
                >
                  {cart[selectedPurchaseProduct?.id || ""] ? "Update Selection" : "Add to Bag"} • {formatCurrency(linePrice, selectedPurchaseProduct?.currency || preferredCurrency)}
                </Button>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
