import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "@/types";
import { Package } from "lucide-react";
import { formatCurrency } from "@/constants";

interface DeliveryConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { paymentStatus: string }) => void;
}

export const DeliveryConfirmationModal = ({ order, isOpen, onClose, onConfirm }: DeliveryConfirmationModalProps) => {
  const [paymentStatus, setPaymentStatus] = useState("paid");

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      paymentStatus
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Confirm Delivery</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Complete the delivery for <strong className="text-zinc-900">{order.retailerName}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6 md:py-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Current Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus} required>
                <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-zinc-50 border-none font-black uppercase text-[10px] tracking-widest px-6 outline-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="paid" className="font-black uppercase text-[9px] tracking-widest py-3">Paid (Handover Complete)</SelectItem>
                  <SelectItem value="unpaid" className="font-black uppercase text-[9px] tracking-widest py-3">Unpaid (Invoice Issued)</SelectItem>
                  <SelectItem value="credit" className="font-black uppercase text-[9px] tracking-widest py-3">Credit (Line Applied)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 rounded-2xl bg-zinc-900 text-white flex justify-between items-center shadow-xl">
               <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase tracking-widest opacity-50 italic">Total Value</p>
                 <p className="text-xl font-black italic tracking-tighter">{formatCurrency(order.totalAmount, order.currency)}</p>
               </div>
               <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                 <Package className="h-5 w-5 text-zinc-400" />
               </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="rounded-2xl h-12 md:h-14 px-8 flex-1 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl w-full sm:w-auto hover:scale-[1.02] transition-all">
              Confirm Delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
