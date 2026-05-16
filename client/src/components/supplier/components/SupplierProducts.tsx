import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Product, Order, SystemUser } from "@/types";
import { formatCurrency, CURRENCIES } from "@/constants";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Package, Edit2, Trash2, Image as ImageIcon, Loader2, ShoppingBag, ClipboardList, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SupplierProductsProps {
  orders: Order[];
  employees: SystemUser[];
  onPaymentStatusUpdate: (orderId: string, status: string) => void;
  onEmployeeAssign: (orderId: string, employeeId: string) => void;
  onOrderDelete: (orderId: string) => void;
}

export const SupplierProducts: React.FC<SupplierProductsProps> = ({ 
  orders, 
  employees, 
  onPaymentStatusUpdate, 
  onEmployeeAssign,
  onOrderDelete
}) => {
  const { activeOrg } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSortOrder, setOrderSortOrder] = useState("newest");
  const [orderRetailerFilter, setOrderRetailerFilter] = useState("all");

  useEffect(() => {
    if (activeOrg) {
      fetchProducts();
    }
  }, [activeOrg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { 
      toast.error("Image too large. Please use a file under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = async () => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      const response = await api.get("/products");
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch inventory vector.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name,
        description,
        price: parseFloat(price),
        currency,
        imageUrl: imageUrl || `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop`,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
        toast.success("Product schema updated.");
      } else {
        await api.post("/products", productData);
        toast.success("New product node initialized.");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Data synchronization failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setCurrency(product.currency);
    setImageUrl(product.imageUrl || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirm permanent deletion of product node?")) return;
    setIsDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product node purged from registry.");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Purge operation failed.");
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setCurrency("USD");
    setImageUrl("");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.retailerName?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearchTerm.toLowerCase());
    const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    const matchesRetailer = orderRetailerFilter === "all" || o.retailerName === orderRetailerFilter;
    return matchesSearch && matchesStatus && matchesRetailer;
  }).sort((a, b) => {
    if (orderSortOrder === "newest") {
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    } else if (orderSortOrder === "oldest") {
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    } else if (orderSortOrder === "value_high") {
      return b.totalAmount - a.totalAmount;
    } else if (orderSortOrder === "value_low") {
      return a.totalAmount - b.totalAmount;
    }
    return 0;
  });

  const uniqueRetailers = Array.from(new Set(orders.map(o => o.retailerName))).filter(Boolean);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Inventory Management</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 italic">
            Control center for product catalogs and order flows
          </p>
        </div>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <TabsList className="bg-zinc-100 p-1 rounded-2xl h-14 w-fit shadow-inner">
                <TabsTrigger value="catalog" className="rounded-xl px-8 h-full font-black uppercase italic text-[10px] tracking-widest text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xl transition-all">
                    <Package className="mr-2 h-4 w-4" /> Product List
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-xl px-8 h-full font-black uppercase italic text-[10px] tracking-widest text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xl transition-all">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Current Orders
                    {orders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[8px] animate-pulse">
                        {orders.filter(o => o.status === 'pending').length}
                    </span>
                    )}
                </TabsTrigger>
            </TabsList>

            {/* Actions for catalog only */}
            <TabsContent value="catalog" className="mt-0">
                <Button 
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="rounded-xl h-14 px-8 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl hover:scale-[1.02] transition-all w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-5 w-5" /> Initialize Product
                </Button>
            </TabsContent>
        </div>

        <TabsContent value="catalog" className="space-y-10 mt-0 focus-visible:ring-0">
          <div className="relative group max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <Input 
              placeholder="Filter catalog by product name or description..." 
              className="pl-14 rounded-2xl h-14 border-none bg-white shadow-xl font-black text-xs uppercase italic tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 opacity-50">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing Buffer...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-white">
                  <div className="aspect-square relative overflow-hidden bg-zinc-100">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-10 w-10 p-0 rounded-xl bg-white/90 backdrop-blur-md shadow-lg"
                        onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                      >
                        <Edit2 className="h-4 w-4 text-zinc-900" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-10 w-10 p-0 rounded-xl bg-rose-500 text-white shadow-lg"
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        disabled={isDeleting === product.id}
                      >
                        {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-zinc-900/80 backdrop-blur-md text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-xl border-none">
                        {formatCurrency(product.price, product.currency)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <h4 className="text-lg font-black uppercase italic tracking-tighter truncate text-zinc-900">{product.name}</h4>
                    <p className="text-[10px] font-medium text-zinc-500 mt-2 line-clamp-2 leading-relaxed h-10">
                      {product.description || "No tactical description provided."}
                    </p>
                    <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Inventory Confirmed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center flex flex-col items-center justify-center opacity-30 select-none">
              <ImageIcon className="h-20 w-20 mb-6 animate-pulse" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Catalog Matrix Empty</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Deploy your first product to activate global marketplace</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-10 mt-0 focus-visible:ring-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
              <Input 
                placeholder="Query requests by source node or ID..." 
                className="pl-14 rounded-2xl h-14 border-none bg-white shadow-xl font-black text-xs uppercase italic tracking-widest focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
              />
            </div>
            <Select value={orderRetailerFilter} onValueChange={setOrderRetailerFilter}>
                <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest px-8 outline-none">
                    <SelectValue placeholder="Target Node" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 max-w-[280px]">
                    <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">All Regions</SelectItem>
                    {uniqueRetailers.map(retailer => (
                        <SelectItem key={retailer} value={retailer} className="font-black uppercase text-[9px] tracking-widest py-3 truncate">
                            {retailer}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest px-8 outline-none">
                    <SelectValue placeholder="Lifecycle Scope" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">All Requests</SelectItem>
                    <SelectItem value="pending" className="font-black uppercase text-[9px] tracking-widest py-3">Pending Initiation</SelectItem>
                    <SelectItem value="assigned" className="font-black uppercase text-[9px] tracking-widest py-3">Agent Assigned</SelectItem>
                    <SelectItem value="out_for_delivery" className="font-black uppercase text-[9px] tracking-widest py-3">In Transit</SelectItem>
                    <SelectItem value="delivered" className="font-black uppercase text-[9px] tracking-widest py-3">Link Completed</SelectItem>
                </SelectContent>
            </Select>

            <Select value={orderSortOrder} onValueChange={setOrderSortOrder}>
                <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest px-8 outline-none">
                    <SelectValue placeholder="Priority Vector" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="newest" className="font-black uppercase text-[9px] tracking-widest py-3">Temporal: Newest First</SelectItem>
                    <SelectItem value="oldest" className="font-black uppercase text-[9px] tracking-widest py-3">Temporal: Oldest First</SelectItem>
                    <SelectItem value="value_high" className="font-black uppercase text-[9px] tracking-widest py-3">Value: Magnitude High</SelectItem>
                    <SelectItem value="value_low" className="font-black uppercase text-[9px] tracking-widest py-3">Value: Magnitude Low</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-zinc-900">
                <TableRow className="hover:bg-zinc-900 border-none h-16">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Retailer</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Products</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Total Amount</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-10">Assigned To</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.filter(o => o.items && o.items.length > 0).map((order) => (
                  <TableRow key={order.id} className="h-24 hover:bg-zinc-50/80 transition-all border-b border-zinc-50 group">
                    <TableCell className="px-10">
                      <div className="flex flex-col">
                        <span className="font-black text-zinc-900 uppercase italic text-sm">{order.retailerName}</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">ID: #{order.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-10">
                      <div className="space-y-1.5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                             <span className="text-[10px] font-black uppercase italic tracking-tighter text-zinc-700">{item.name} <span className="text-zinc-300 mx-1">×</span> {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-10">
                      <span className="font-black text-zinc-900 text-lg italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</span>
                    </TableCell>
                    <TableCell className="px-10">
                      <Badge variant={(
                        order.status === "delivered" ? "success" : 
                        order.status === "out_for_delivery" ? "warning" :
                        order.status === "assigned" ? "default" : "secondary"
                      ) as any} className="rounded-xl h-7 font-black uppercase text-[8px] italic px-4 tracking-[0.1em] border-none">
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-10">
                       <Select 
                        value={order.employeeId || "unassigned"} 
                        onValueChange={(val: string) => onEmployeeAssign(order.id, val)}
                        disabled={order.status === 'delivered'}
                      >
                        <SelectTrigger className="h-11 border-none bg-zinc-50 font-black uppercase text-[10px] tracking-tight italic rounded-xl px-5 shadow-sm w-[180px] focus:ring-1 focus:ring-zinc-900/5">
                          <SelectValue placeholder="Dispatch Agent" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[220px]">
                           <SelectItem value="unassigned" className="font-black uppercase text-[9px] tracking-widest py-3">
                             <div className="flex items-center gap-2 text-zinc-400">
                               <AlertCircle className="h-3 w-3" />
                               UNASSIGNED
                             </div>
                           </SelectItem>
                           {employees.map(emp => (
                             <SelectItem key={emp.uid} value={emp.uid} className="font-black uppercase text-[9px] tracking-widest py-3 hover:bg-zinc-50 transition-colors rounded-xl">
                               <div className="flex items-center gap-3">
                                 <div className="h-7 w-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-[9px]">
                                   {emp.name?.charAt(0)}
                                 </div>
                                 {emp.name}
                               </div>
                             </SelectItem>
                           ))}
                        </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="pr-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`[SupplierProducts] Purge initiated for: ${order.id}`);
                          if (window.confirm(`PURGE MANIFEST #${order.id.slice(-8).toUpperCase()}?\nThis action is permanent.`)) {
                            onOrderDelete(order.id);
                          }
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center opacity-20 group">
                          <ClipboardList className="h-16 w-16 mb-4 transition-transform group-hover:scale-110 duration-500" />
                          <h4 className="text-xl font-black uppercase italic tracking-tighter">Request Queue Null</h4>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Awaiting external retailer signal</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editingProduct ? "Revise Entity" : "Initialize Entity"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Define the parameters for your product node
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Product Name</Label>
                <Input 
                  required
                  placeholder="e.g., Logistic Container"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Unit Price</Label>
                  <Input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-none font-bold uppercase text-[10px] tracking-widest text-zinc-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code} className="font-black uppercase text-[9px] tracking-widest py-3">
                          {curr.code} ({curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Visual Asset</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-48 rounded-[2rem] bg-zinc-50 border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 transition-all overflow-hidden"
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-black uppercase text-[10px] tracking-widest">Swap Asset</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-300">
                      <ImageIcon className="h-10 w-10 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Select Visual Node</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Strategic Description</Label>
                <Textarea 
                  placeholder="Detail the technical specifications and operational benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] rounded-2xl bg-zinc-50 border-none font-bold p-6 placeholder:text-zinc-300"
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-between gap-4 pt-4 border-t border-zinc-100">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-2xl h-14 px-8 flex-1 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-6xl"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  editingProduct ? "Re-sync Registry" : "Initialize Node"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
