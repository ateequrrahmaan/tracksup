import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Play, 
  BookOpen, 
  Sparkles, 
  FileEdit, 
  Coins, 
  ChevronRight, 
  Search,
  Building
} from "lucide-react";
import { toast } from "sonner";
import { Task, ChecklistItem } from "@/types";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/constants";

export const EmployeeTasks: React.FC = () => {
  const { user, activeOrg, preferredCurrency } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Procurement Recording form State
  const [activeProcureTask, setActiveProcureTask] = useState<Task | null>(null);
  const [isProcureFormOpen, setIsProcureFormOpen] = useState(false);
  const [purchasedQuantities, setPurchasedQuantities] = useState<Record<string, number>>({});
  const [purchaseCosts, setPurchaseCosts] = useState<Record<string, number>>({});
  const [employeeNotes, setEmployeeNotes] = useState("");
  const [submittingProcure, setSubmittingProcure] = useState(false);

  // Item-level completion states
  const [activeItemTask, setActiveItemTask] = useState<Task | null>(null);
  const [activeCompletionItem, setActiveCompletionItem] = useState<any | null>(null);
  const [isItemCompletionOpen, setIsItemCompletionOpen] = useState(false);
  const [actualQty, setActualQty] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Paid" | "Credit">("Paid");
  const [itemNotes, setItemNotes] = useState<string>("");

  // Load employee specific tasks
  useEffect(() => {
    if (!user || !activeOrg) return;

    setLoading(true);
    const tasksQuery = query(
      collection(db, "tasks"),
      where("supplierId", "==", activeOrg.id),
      where("employeeId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setTasks(docs);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, "tasks");
      }
    );

    return () => unsubscribe();
  }, [user, activeOrg]);

  // Handle standard status updates for tasks
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Operational step transitioned: ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  // Toggle dynamic checklist item completion straight into Firestore
  const handleToggleChecklistItem = async (task: Task, itemIndex: number) => {
    if (!task.checklist) return;

    const updatedChecklist = [...task.checklist];
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      completed: !updatedChecklist[itemIndex].completed
    };

    try {
      await updateDoc(doc(db, "tasks", task.id), {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to commit checklist step.");
    }
  };

  // Pre-fill Procurement Form
  const openProcurementRecordForm = (task: Task) => {
    setActiveProcureTask(task);
    
    const quantities: Record<string, number> = {};
    const costs: Record<string, number> = {};
    
    task.items?.forEach(item => {
      quantities[item.productId] = item.quantity; // Default actual unit is requested qty
      costs[item.productId] = 0; // Cost defaults to 0, employee fills it
    });

    setPurchasedQuantities(quantities);
    setPurchaseCosts(costs);
    setEmployeeNotes("");
    setIsProcureFormOpen(true);
  };

  // Submit Procurement actual details to Supplier Review
  const handleSubmitProcurementRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProcureTask) return;

    // Check if any cost is blank or negative
    const hasInvalidCost = Object.values(purchaseCosts).some((cost: any) => typeof cost === "number" && cost < 0);
    if (hasInvalidCost) {
      toast.error("Please enter valid purchase costs.");
      return;
    }

    setSubmittingProcure(true);
    try {
      const updatedItems = activeProcureTask.items?.map(item => {
        const pQty = purchasedQuantities[item.productId] ?? item.quantity;
        const pCost = purchaseCosts[item.productId] ?? 0;
        return {
          ...item,
          purchasedQuantity: pQty,
          purchaseCost: pCost
        };
      });

      const taskRef = doc(db, "tasks", activeProcureTask.id);
      await updateDoc(taskRef, {
        items: updatedItems,
        employeeNotes: employeeNotes.trim(),
        status: "awaiting_approval", // Gating Status for Supplier Approval
        updatedAt: serverTimestamp()
      });

      toast.success("Procurement logs logged! Routed for Supplier reviewing.");
      setIsProcureFormOpen(false);
      setActiveProcureTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Procurement log write failed.");
    } finally {
      setSubmittingProcure(false);
    }
  };

  // Open item-level completion modal
  const openItemCompletionModal = (task: Task, item: any) => {
    setActiveItemTask(task);
    setActiveCompletionItem(item);
    
    // Autofill or retain current recorded values if they have touched it before
    setActualQty(item.purchasedQuantity ?? item.quantity);
    setUnitCost(item.purchaseCost ?? 0);
    setPaymentMethod(item.paymentMethod ?? "Paid");
    setItemNotes(item.notes ?? "");
    
    setIsItemCompletionOpen(true);
  };

  // Confirm item-level completion and write updates inline to Firestore
  const handleConfirmItemCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemTask || !activeCompletionItem) return;

    if (unitCost < 0) {
      toast.error("Cost cannot be negative.");
      return;
    }

    try {
      // Create copy of the items list
      const updatedItems = activeItemTask.items?.map(item => {
        if (item.productId === activeCompletionItem.productId && item.vendorId === activeCompletionItem.vendorId) {
          return {
            ...item,
            completed: true,
            purchasedQuantity: actualQty,
            purchaseCost: unitCost,
            paymentMethod,
            notes: itemNotes.trim()
          };
        }
        return item;
      }) || [];

      // Determine task wide completion status by checking if all flatItems are completed!
      const allDone = updatedItems.every(item => item.completed);
      const newStatus = allDone ? "awaiting_approval" : "in_progress";

      await updateDoc(doc(db, "tasks", activeItemTask.id), {
        items: updatedItems,
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      if (allDone) {
        toast.success("Fantastic! All items have been sourced. Sourcing directive is now awaiting supplier review!");
      } else {
        toast.success(`Recorded purchase progress for ${activeCompletionItem.productName}.`);
      }

      setIsItemCompletionOpen(false);
      setActiveItemTask(null);
      setActiveCompletionItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to commit step record.");
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = !["completed", "verified", "stock_added"].includes(t.status);
      } else if (statusFilter === "completed") {
        matchesStatus = ["completed", "verified", "stock_added"].includes(t.status);
      }
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // Analytics counts
  const stats = useMemo(() => {
    const active = tasks.filter(t => !["completed", "verified", "stock_added"].includes(t.status)).length;
    const completed = tasks.filter(t => ["completed", "verified", "stock_added"].includes(t.status)).length;
    return { active, completed };
  }, [tasks]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-6">
      
      {/* Top Banner section */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-zinc-300">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Operational Chores</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1.5">
              Fulfill organization-based checklists or execute product procurement runs
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">Active Tasks</span>
              <span className="text-xl font-black text-amber-400 italic mt-1.5 block">{stats.active} Chores</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-[8px] font-black uppercase text-white/40 tracking-widest leading-none">Receipt Cleared</span>
              <span className="text-xl font-black text-emerald-400 italic mt-1.5 block">{stats.completed} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <input 
            placeholder="Search operational guidelines..." 
            className="pl-12 rounded-2xl h-12 border-none bg-white shadow-sm font-bold text-xs uppercase tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto bg-white p-1 rounded-2xl shadow-sm border border-zinc-100">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("active")}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
              statusFilter === "active" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-500"
            }`}
          >
            Active Operations ({stats.active})
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
              statusFilter === "completed" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-zinc-500"
            }`}
          >
            Completed Records ({stats.completed})
          </Button>
        </div>
      </div>

      {/* Main Task Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
          <p className="text-[10px] font-black uppercase tracking-widest italic text-zinc-500">Connecting Fleet Ledger feed...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const isChecklist = task.taskType === "checklist";
              
              // Custom colors matching states
              let badgeColorClass = "bg-zinc-100 text-zinc-700";
              if (task.status === "completed" || task.status === "stock_added" || task.status === "verified") {
                badgeColorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
              } else if (task.status === "awaiting_approval" || task.status === "purchased") {
                badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-200";
              } else if (task.status === "approved") {
                badgeColorClass = "bg-indigo-50 text-indigo-705 border border-indigo-200";
              } else if (task.status === "in_progress" || task.status === "accepted") {
                badgeColorClass = "bg-blue-50 text-blue-700 border border-blue-200";
              }

              // Checklist details
              const checklistTotal = task.checklist?.length || 0;
              const checklistDone = task.checklist?.filter(i => i.completed).length || 0;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge className="font-extrabold uppercase text-[7px] px-2 py-0.5 rounded-full border-none bg-zinc-900 text-white">
                          {task.taskType}
                        </Badge>
                        <Badge className={`font-black uppercase text-[7px] px-2 py-0.5 rounded-full border-none ${badgeColorClass}`}>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                        {task.priority && (
                          <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-[7px] font-black uppercase">
                            {task.priority} Focus
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base font-black text-zinc-900 uppercase italic tracking-tight line-clamp-1 mt-1">
                        {task.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 pb-4 space-y-4">
                      {task.description && (
                        <p className="text-zinc-500 text-xs leading-relaxed italic">
                          "{task.description}"
                        </p>
                      )}

                      {/* Interaction Area for Checklists */}
                      {isChecklist && (
                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
                          <div className="flex justify-between items-center text-[9px] uppercase font-black text-zinc-400">
                            <span>Checklist sequence progress</span>
                            <span className="text-zinc-850 font-black">{checklistDone}/{checklistTotal} Verified</span>
                          </div>
                          
                          {/* Only allow interaction if task is In Progress or Accepted */}
                          <div className="space-y-2 pt-1 max-h-[160px] overflow-y-auto">
                            {task.checklist?.map((item, index) => {
                              const allowCheck = ["accepted", "in_progress"].includes(task.status);
                              return (
                                <div 
                                  key={`cl-item-${index}`} 
                                  onClick={() => allowCheck && handleToggleChecklistItem(task, index)}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                                    allowCheck ? "cursor-pointer hover:bg-white" : ""
                                  } ${item.completed ? "bg-zinc-100/50 border-transparent text-zinc-400" : "bg-white border-zinc-100 text-zinc-750"}`}
                                >
                                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    item.completed ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300 bg-white"
                                  }`}>
                                    {item.completed && <CheckCircle2 className="h-4.5 w-4.5" />}
                                  </div>
                                  <span className={`text-xs font-semibold ${item.completed ? "line-through" : ""}`}>{item.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Procurement Item View */}
                      {!isChecklist && (
                        <div className="space-y-4">
                          {/* Sourcing tracker summary */}
                          <div className="bg-zinc-100/50 p-3 rounded-2xl flex justify-between items-center text-[10px] uppercase font-black text-zinc-500">
                            <span>Mission Progress</span>
                            <span className="text-zinc-800">
                              {task.items?.filter(item => item.completed).length || 0} / {task.items?.length || 0} Completed
                            </span>
                          </div>

                          <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-zinc-900 h-full transition-all duration-300"
                              style={{ 
                                width: `${
                                  task.items && task.items.length > 0 
                                    ? (task.items.filter(i => i.completed).length / task.items.length) * 100 
                                    : 0
                                }%` 
                              }}
                            />
                          </div>

                          {/* Sourcing items list grouped by vendor */}
                          <div className="space-y-3.5 pt-1 max-h-[220px] overflow-y-auto pr-1">
                            {(() => {
                              // Dynamically group items by vendor within the card
                              const grouped: Record<string, { vendorName: string; items: any[] }> = {};
                              task.items?.forEach(item => {
                                if (!grouped[item.vendorId]) {
                                  grouped[item.vendorId] = {
                                    vendorName: item.vendorName,
                                    items: []
                                  };
                                }
                                grouped[item.vendorId].items.push(item);
                              });

                              return Object.entries(grouped).map(([vendorId, group]) => (
                                <div key={vendorId} className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">
                                    <Building className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>{group.vendorName}</span>
                                  </div>

                                  <div className="space-y-1">
                                    {group.items.map((item, keyIdx) => {
                                      const isTaskActive = task.status === "in_progress";
                                      return (
                                        <div
                                          key={`${vendorId}-${item.productId}-${keyIdx}`}
                                          onClick={() => {
                                            if (isTaskActive) {
                                              openItemCompletionModal(task, item);
                                            } else {
                                              toast.info("Please accept and start the procurement directive to log purchases.");
                                            }
                                          }}
                                          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-all ${
                                            isTaskActive ? "cursor-pointer hover:bg-zinc-100 hover:border-zinc-350 active:scale-[0.99]" : "opacity-80"
                                          } ${item.completed ? "bg-zinc-100/50 border-transparent text-zinc-400" : "bg-white border-zinc-100 text-zinc-750"}`}
                                        >
                                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                            item.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-300 bg-white"
                                          }`}>
                                            {item.completed && <CheckCircle2 className="h-3 w-3" />}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black uppercase tracking-tight truncate ${item.completed ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                                              {item.productName}
                                            </p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                              {item.completed ? (
                                                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                                                  Got: {item.purchasedQuantity} {item.unit || "Piece"} @ {formatCurrency(item.purchaseCost ?? 0, preferredCurrency)} ({item.paymentMethod})
                                                </span>
                                              ) : (
                                                <span>Target: {item.quantity} {item.unit || "Piece"}</span>
                                              )}
                                            </p>
                                          </div>
                                          
                                          <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="text-[10px] uppercase font-black text-zinc-400 flex items-center gap-1 justify-end pt-2">
                          <Clock className="h-3.5 w-3.5" /> Due date limit: <b className="text-zinc-600">{task.dueDate}</b>
                        </div>
                      )}
                    </CardContent>

                    {/* Button footer actions guided by status flow */}
                    <CardFooter className="bg-zinc-50 p-4 border-t border-zinc-100">
                      {/* Gated Flow handles */}
                      {task.status === "assigned" && (
                        <Button 
                          onClick={() => handleUpdateStatus(task.id, "accepted")}
                          className="w-full rounded-2xl h-11 bg-zinc-900 text-white hover:bg-zinc-800 font-black uppercase text-[9px] tracking-widest shadow-lg"
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> Accept Task
                        </Button>
                      )}

                      {task.status === "accepted" && (
                        <Button 
                          onClick={() => handleUpdateStatus(task.id, "in_progress")}
                          className="w-full rounded-2xl h-11 bg-blue-600 text-white hover:bg-blue-700 font-black uppercase text-[9px] tracking-widest shadow-lg"
                        >
                          <Play className="mr-2 h-4 w-4" /> {isChecklist ? "Start Checklist steps" : "Start Sourcing Mission"}
                        </Button>
                      )}

                      {task.status === "in_progress" && isChecklist && (
                        <Button 
                          onClick={() => handleUpdateStatus(task.id, "completed")}
                          disabled={checklistDone < checklistTotal}
                          className="w-full rounded-2xl h-11 bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase text-[9px] tracking-widest shadow-lg"
                        >
                          {checklistDone < checklistTotal ? (
                            <span>Check all steps to finalize</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4" /> Submit Completed Checklist</span>
                          )}
                        </Button>
                      )}

                      {task.status === "in_progress" && !isChecklist && (
                        <div className="w-full py-2.5 text-center text-zinc-650 text-[10px] font-black uppercase tracking-widest bg-zinc-100/50 rounded-xl border border-zinc-150 flex flex-col items-center justify-center gap-1 shadow-sm">
                          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Sourcing Mission Active</span>
                          <span className="text-[8px] text-zinc-400 font-bold uppercase">Tick products above to record purchase logs</span>
                        </div>
                      )}

                      {/* Read only status labels */}
                      {task.status === "awaiting_approval" && (
                        <div className="w-full py-2 text-center text-amber-700 text-[10px] font-black uppercase tracking-widest bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center gap-1.5 animate-pulse">
                          <Clock className="h-4 w-4 shrink-0" /> Pending Sourcing Review
                        </div>
                      )}

                      {task.status === "approved" && (
                        <div className="w-full py-2 text-center text-indigo-700 text-[10px] font-black uppercase tracking-widest bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center gap-1.5">
                          Approved | Awaiting Intake Sizing
                        </div>
                      )}

                      {task.status === "stock_added" && (
                        <div className="w-full py-2.5 text-center text-emerald-700 text-[10px] font-black uppercase tracking-widest bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Stocked & Run Closed
                        </div>
                      )}

                      {task.status === "completed" && isChecklist && (
                        <div className="w-full py-2.5 text-center text-emerald-750 text-[10px] font-black uppercase tracking-widest bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1">
                          <Sparkles className="h-4 w-4" /> Completed | Pending Dispatcher Verification
                        </div>
                      )}

                      {task.status === "verified" && (
                        <div className="w-full py-2.5 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Dispatcher Verified
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="rounded-[2.2rem] border-2 border-dashed border-zinc-200 py-16 text-center shadow-none flex flex-col items-center justify-center max-w-sm mx-auto bg-white/50">
          <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-4 animate-bounce">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="font-black uppercase italic tracking-tight text-zinc-700 text-sm">Task Ledger Settled</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-2 max-w-xs px-4">
            You don't have any matching issued tasks. Check active/history tabs or check your delivery shifts.
          </p>
        </Card>
      )}

      {/* Individual Item Sourcing Completion Dialog */}
      <Dialog open={isItemCompletionOpen} onOpenChange={setIsItemCompletionOpen}>
        {activeCompletionItem && (
          <DialogContent className="rounded-[2.2rem] p-10 border-none shadow-2xl sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Sourcing Log Record</DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Sourced from {activeCompletionItem.vendorName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleConfirmItemCompletion} className="space-y-6 pt-4">
              <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-2.5xl space-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Selected Product</span>
                  <span className="text-sm font-black uppercase text-zinc-800 tracking-tight">{activeCompletionItem.productName}</span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Expected quantity: {activeCompletionItem.quantity} {activeCompletionItem.unit || "Piece"}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/50">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Actual Quantity ({activeCompletionItem.unit || "Piece"})</Label>
                    <Input 
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={actualQty}
                      onChange={(e) => setActualQty(parseFloat(e.target.value) || 0)}
                      className="h-11 text-xs font-semibold bg-white border-zinc-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Unit Cost ({preferredCurrency})</Label>
                    <Input 
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={unitCost || ""}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                      className="h-11 text-xs font-semibold bg-white border-zinc-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Payment Method / Terms</Label>
                  <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                    <SelectTrigger className="h-11 border-zinc-200 bg-white rounded-xl text-xs font-semibold shadow-none">
                      <SelectValue placeholder="Terms" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl p-2">
                      <SelectItem value="Paid" className="font-semibold text-xs py-2 rounded-lg">Paid (Upfront)</SelectItem>
                      <SelectItem value="Credit" className="font-semibold text-xs py-2 rounded-lg">Vendor Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sourcing notes */}
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Purchasing Notes / Sourcing memo</Label>
                <Textarea 
                  placeholder="e.g. Received Kumar discount, Pepsi stocks limited..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="rounded-xl border-zinc-150 p-3.5 text-xs text-zinc-750 min-h-[70px]"
                />
              </div>

              <DialogFooter className="pt-2 flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsItemCompletionOpen(false);
                    setActiveItemTask(null);
                    setActiveCompletionItem(null);
                  }}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest flex-1 border border-zinc-200 h-10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-black uppercase text-[10px] tracking-widest px-6 flex-1 h-10 shadow-md"
                >
                  Save Item Logs
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
