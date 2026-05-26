import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, ClipboardList, Clock, CheckCircle2, User, Trash2, Calendar, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Task, SystemUser } from "@/types";
import { motion, AnimatePresence } from "motion/react";

interface SupplierTasksProps {
  employees: SystemUser[];
}

export const SupplierTasks: React.FC<SupplierTasksProps> = ({ employees }) => {
  const { activeOrg } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  // New task form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeOrg) return;

    setLoading(true);
    const tasksQuery = query(
      collection(db, "tasks"),
      where("supplierId", "==", activeOrg.id)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const docs: Task[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as Task;
        });

        // Client-side sort by createdAt descending safely
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
  }, [activeOrg]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    if (!title.trim() || !description.trim() || !assignedEmployeeId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedEmp = employees.find((emp) => emp.uid === assignedEmployeeId);
      const newTaskData = {
        title: title.trim(),
        description: description.trim(),
        supplierId: activeOrg.id,
        employeeId: assignedEmployeeId,
        employeeName: selectedEmp ? selectedEmp.name : "Unknown Employee",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "tasks"), newTaskData);
      toast.success("Task created and assigned successfully.");
      setTitle("");
      setDescription("");
      setAssignedEmployeeId("");
      setIsCreateOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "tasks");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task removed successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Task marked as ${newStatus}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { total, pending, completed };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesEmployee = employeeFilter === "all" || t.employeeId === employeeFilter;
      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [tasks, searchTerm, statusFilter, employeeFilter]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header section with Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-zinc-850" /> Task Ledger
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Dispatch, manage, and verify administrative internal chores
          </p>
        </div>
        <div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 font-black uppercase text-[11px] tracking-widest bg-zinc-900 text-white hover:bg-zinc-850 shadow-xl transition-all hover:scale-[1.02]">
                <Plus className="mr-2 h-4 w-4" /> Create Operation Task
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl border-none shadow-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase mb-1 flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-zinc-900" /> New Operation Task
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Assign internal tasks and chores to your fleet crew
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Task Title</Label>
                  <Input 
                    id="task-title"
                    placeholder="e.g. Collect warehouse raw materials" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 rounded-xl bg-zinc-50 border-none font-bold uppercase text-[10px] tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-desc" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed Instructions</Label>
                  <Textarea 
                    id="task-desc"
                    placeholder="Describe exactly what needs to be performed..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] rounded-xl bg-zinc-50 border-none font-medium text-xs text-zinc-800 p-4 focus-visible:ring-2 focus-visible:ring-zinc-900/5 placeholder:text-zinc-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-employee" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Assign Operations Employee</Label>
                  <Select value={assignedEmployeeId} onValueChange={setAssignedEmployeeId}>
                    <SelectTrigger id="task-employee" className="h-12 rounded-xl bg-zinc-50 border-none font-bold uppercase text-[10px] tracking-widest text-zinc-900 shadow-none">
                      <SelectValue placeholder="Select fleet crew member" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl p-2 max-h-56">
                      {employees.length === 0 ? (
                        <div className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          No active employees found
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <SelectItem key={emp.uid} value={emp.uid} className="font-bold text-xs py-3 rounded-lg">
                            {emp.name} ({emp.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsCreateOpen(false)}
                    className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-850 font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-zinc-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Queuing Operation...
                      </>
                    ) : (
                      "Issue Operational Task"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-[1.8rem] border-none shadow-xl bg-white p-6 relative overflow-hidden transition-all hover:scale-[1.01]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Issued Operations</p>
              <h3 className="text-4xl font-black italic text-zinc-900 mt-2">{stats.total}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-none shadow-xl bg-amber-50/50 p-6 relative overflow-hidden border border-amber-100 transition-all hover:scale-[1.01]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Execution</p>
              <h3 className="text-4xl font-black italic text-amber-700 mt-2">{stats.pending}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-none shadow-xl bg-emerald-50/50 p-6 relative overflow-hidden border border-emerald-100 transition-all hover:scale-[1.01]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Succeeded / Verified</p>
              <h3 className="text-4xl font-black italic text-emerald-700 mt-2">{stats.completed}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <Input 
            placeholder="Search tasks by title or instructions..." 
            className="pl-14 rounded-2xl h-14 border-none bg-white shadow-xl font-black text-xs uppercase italic tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Status selector */}
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest text-zinc-900">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">All Statuses</SelectItem>
                <SelectItem value="pending" className="font-black uppercase text-[9px] tracking-widest py-3 text-amber-600">Pending Execution</SelectItem>
                <SelectItem value="completed" className="font-black uppercase text-[9px] tracking-widest py-3 text-emerald-600">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee selector */}
          <div className="w-full sm:w-52">
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="h-14 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-[10px] tracking-widest text-zinc-900">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2 max-h-56">
                <SelectItem value="all" className="font-black uppercase text-[9px] tracking-widest py-3">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={`filter-${emp.uid}`} value={emp.uid} className="font-medium text-xs py-3">
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Task List panel */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="h-12 w-12 animate-spin text-zinc-900" />
          <p className="text-[10px] font-black uppercase tracking-widest italic text-zinc-500">Retrieving operational feeds...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-[2.2rem] border border-none shadow-xl overflow-hidden flex flex-col h-full bg-white transition-all hover:scale-[1.01]">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Badge 
                          variant={task.status === "completed" ? "success" : "warning"}
                          className="font-black uppercase text-[8px] tracking-[0.15em] px-3 py-1.5 rounded-full mb-3 inline-flex items-center gap-1.5 border-none"
                        >
                          {task.status === "completed" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> COMPLETED
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 animate-pulse" /> PENDING
                            </>
                          )}
                        </Badge>
                        <CardTitle className="text-lg font-black text-zinc-950 uppercase italic tracking-tight line-clamp-2">
                          {task.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-zinc-400 hover:text-rose-500 shrink-0 h-9 w-9 rounded-full hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <p className="text-zinc-650 pr-2 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {task.description}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Crew Person</p>
                          <p className="text-xs font-black text-zinc-800 line-clamp-1">{task.employeeName}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-zinc-50 p-4 border-t border-zinc-100 flex gap-2">
                    <Button 
                      onClick={() => handleToggleStatus(task)}
                      variant={task.status === "completed" ? "outline" : "default"}
                      className={`w-full rounded-2xl font-black uppercase text-[9px] tracking-widest h-11 transition-all flex items-center justify-center gap-2 ${
                        task.status === "completed" 
                          ? "bg-transparent border-zinc-200 text-zinc-750 hover:bg-zinc-100" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg shadow-inner"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" /> Re-open Task
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve Accomplishment
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="rounded-[2.2rem] border-2 border-dashed border-zinc-200 shadow-none py-16 text-center bg-white flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="font-black uppercase italic tracking-tight text-zinc-800 text-lg">No Active Operational Tasks</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-2 max-w-sm px-6">
            All crew operations are clear, or no issued tasks match your current query. Use the action menu above to assign a task.
          </p>
        </Card>
      )}
    </div>
  );
};
