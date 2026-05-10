import React, { useState, useEffect } from "react";
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
import { Search, ShoppingCart, Loader2, Package, Store, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import { toast } from "sonner";

interface RetailerMarketplaceProps {
  initialSupplierId?: string | null;
}

export const RetailerMarketplace: React.FC<RetailerMarketplaceProps> = ({ initialSupplierId }) => {
  const { memberships, activeOrg, user } = useAuth();
  const [products, setProducts] = useState<(Product & { supplierName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId || "all");
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<(Product & { supplierName: string }) | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConnectedProducts();
  }, [memberships]);

  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    }
  }, [initialSupplierId]);

  const fetchConnectedProducts = async () => {
    setLoading(true);
    try {
      // Get all organizations where the user is a retailer
      const retailerMems = memberships.filter(m => m.role === "retailer");
      const supplierIds = retailerMems.map(m => m.organizationId);

      if (supplierIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch products for each supplier
      // Note: Firestore 'in' query limited to 10. For now, we'll do individual fetches or a loop if needed.
      // Since it's usually a small number of suppliers for a retailer, we can optimize.
      
      const allProducts: (Product & { supplierName: string })[] = [];
      const connectedSuppliers: {id: string, name: string}[] = [];
      
      for (const supplierId of supplierIds) {
        // Fetch Supplier Organization Name
        const orgSnap = await getDoc(doc(db, "organizations", supplierId));
        const supplierName = orgSnap.exists() ? orgSnap.data().name : "Unknown Supplier";
        
        connectedSuppliers.push({ id: supplierId, name: supplierName });

        const q = query(collection(db, "products"), where("supplierId", "==", supplierId));
        const snapshot = await getDocs(q);
        const supplierProducts = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          supplierName 
        } as Product & { supplierName: string }));
        
        allProducts.push(...supplierProducts);
      }

      setSuppliers(connectedSuppliers);
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      toast.error("Error loading marketplace.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !activeOrg || !user) return;

    setIsSubmitting(true);
    try {
      const orderAmount = selectedProduct.price * quantity;
      
      // Create a new order in the 'orders' collection
      // This will appear in the supplier's dashboard
      await addDoc(collection(db, "orders"), {
        organizationId: selectedProduct.supplierId, // The supplier's org
        supplierId: selectedProduct.supplierId, 
        retailerId: user.uid,
        retailerName: activeOrg.name, // The current retailer's org name
        status: "pending",
        totalAmount: orderAmount,
        currency: selectedProduct.currency,
        items: [{
          name: selectedProduct.name,
          quantity: quantity,
          price: selectedProduct.price
        }],
        deliveryDate: new Date().toISOString().split('T')[0], // Default today for now
        payment_status: "unpaid",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Order placed successfully. Awaiting supplier approval.");
      setIsOrderOpen(false);
      setQuantity(1);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order.");
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
                    onClick={() => { setSelectedProduct(product); setIsOrderOpen(true); }}
                    className="w-full rounded-2xl h-12 font-black uppercase italic tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all text-[10px]"
                   >
                     Order Product <ShoppingCart className="ml-2 h-4 w-4" />
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

      {/* Order Modal */}
      <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          {selectedProduct && (
            <form onSubmit={handlePlaceOrder}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Place Order</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-relaxed">
                  Order units from {selectedProduct.supplierName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8 py-10">
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h5 className="font-black uppercase italic tracking-tight">{selectedProduct.name}</h5>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{formatCurrency(selectedProduct.price, selectedProduct.currency)} / unit</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Order Quantity</Label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 border-b-2 border-zinc-900 pb-0.5">{quantity} UNITS</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-16 w-16 rounded-2xl bg-zinc-100 font-black text-xl hover:bg-zinc-200"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                     >
                       -
                     </Button>
                     <Input 
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="h-16 rounded-2xl bg-zinc-50 border-none font-black text-center text-xl"
                     />
                     <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-16 w-16 rounded-2xl bg-zinc-100 font-black text-xl hover:bg-zinc-200"
                        onClick={() => setQuantity(q => q + 1)}
                     >
                       +
                     </Button>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-zinc-900 text-white flex justify-between items-center shadow-2xl">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50 italic">Total Amount</p>
                    <p className="text-3xl font-black italic tracking-tighter">{formatCurrency(selectedProduct.price * quantity, selectedProduct.currency)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-zinc-400" />
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-between gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOrderOpen(false)}
                  className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="rounded-2xl h-14 px-8 flex-1 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : "Confirm Order"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
