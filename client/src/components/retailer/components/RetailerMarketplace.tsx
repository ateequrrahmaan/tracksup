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

interface RetailerMarketplaceProps {
  initialSupplierId?: string | null;
}

interface CartItem extends Product {
  supplierName: string;
  quantity: number;
}

export const RetailerMarketplace: React.FC<RetailerMarketplaceProps> = ({ initialSupplierId }) => {
  const { memberships, activeOrg, user, activeRole } = useAuth();
  const [products, setProducts] = useState<(Product & { supplierName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId || activeOrg?.id || "all");
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => {
    try {
      const savedCart = localStorage.getItem("tracksup_cart");
      return savedCart ? JSON.parse(savedCart) : {};
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return {};
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem("tracksup_cart", JSON.stringify(cart));
  }, [cart]);

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

  const addToCart = (product: Product & { supplierName: string }) => {
    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }
      return {
        ...prev,
        [product.id]: { ...product, quantity: 1 }
      };
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev[productId];
      if (item) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...prev,
          [productId]: { ...item, quantity: newQty }
        };
      }
      return prev;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const { [productId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const cartItems: CartItem[] = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCurrency = cartItems[0]?.currency || "KES";

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
    // But we still warn them if they might have meant to use an org
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
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
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
            name: p.name,
            quantity: p.quantity,
            price: p.price
          })),
          deliveryDate: new Date().toISOString().split('T')[0],
          payment_status: "unpaid",
        });
      });

      await Promise.all(orderPromises);

      toast.success("All orders placed successfully!");
      setCart({});
      localStorage.removeItem("tracksup_cart");
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
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
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
                  {cartItems.map(item => (
                    <div key={item.id} className="group relative flex items-center gap-6 p-4 rounded-3xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0">
                        <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-zinc-100 text-zinc-900 text-[8px] font-black uppercase tracking-widest rounded-lg px-2 mb-1">
                          {item.supplierName}
                        </Badge>
                        <h5 className="font-black uppercase italic tracking-tight truncate text-sm">{item.name}</h5>
                        <p className="text-xs font-black text-zinc-500 mt-0.5">{formatCurrency(item.price, item.currency)} / unit</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
                            <button 
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="px-3 py-1 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-[10px] font-black">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="px-3 py-1 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black italic text-sm tracking-tighter">
                          {formatCurrency(item.price * item.quantity, item.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
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
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 rounded-lg border-none shadow-sm">
                    {product.supplierName}
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-zinc-900/80 backdrop-blur-md text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-xl border-none">
                    {formatCurrency(product.price, product.currency)}
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
                    onClick={() => addToCart(product)}
                    className="w-full rounded-2xl h-12 font-black uppercase italic tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all text-[10px]"
                   >
                     Add to Bag <Plus className="ml-2 h-4 w-4" />
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

      {/* Order Modal removed in favor of Cart */}
    </div>
  );
};
