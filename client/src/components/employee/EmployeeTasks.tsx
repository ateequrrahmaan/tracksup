import React, { useState, useEffect, useMemo } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ClipboardList, Clock, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Task } from "@/types";
import { motion, AnimatePresence } from "motion/react";

export const EmployeeTasks: React.FC = () => {
  const { user, activeOrg } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    if (!user || !activeOrg) return;

    setLoading(true);
    // Find tasks assigned to this employee for this supplier
    const tasksQuery = query(
      collection(db, "tasks"),
      where("supplierId", "==", activeOrg.id),
      where("employeeId", "==", user.uid)
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

        // Client-side sort by createdAt descending
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

  const handleUpdateStatus = async (task: Task, newStatus: "pending" | "completed") => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(newStatus === "completed" ? "Excellent! Task marked as completed." : "Task re-opened.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { pending, completed };
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
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight">Your Operational Chores</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1.5">
              Fulfill internal non-delivery requests issued by dispatcher
            </p>
          </div>
          
          <div className="flex gap-4 pt-2">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-[8px] font-black uppercase text-white/50 tracking-widest">Active</span>
              <span className="text-xl font-black text-amber-400 italic">{stats.pending}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <span className="block text-[8px] font-black uppercase text-white/50 tracking-widest">Completed</span>
              <span className="text-xl font-black text-emerald-400 italic">{stats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full sm:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            placeholder="Search instructions..." 
            className="pl-12 rounded-2xl h-12 border-none bg-white shadow-sm font-bold text-xs uppercase tracking-widest text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all w-full focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto bg-white p-1 rounded-2xl shadow-sm border border-zinc-100">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
              statusFilter === "all" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-500"
            }`}
          >
            All Tasks
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
              statusFilter === "pending" ? "bg-amber-600 text-white hover:bg-amber-700" : "text-zinc-500"
            }`}
          >
            Pending ({stats.pending})
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider h-10 ${
              statusFilter === "completed" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-zinc-500"
            }`}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Main Task Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
          <p className="text-[10px] font-black uppercase tracking-widest italic text-zinc-500">Connecting Fleet Operations...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="rounded-[2.2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col h-full group hover:shadow-xl hover:scale-[1.01] transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <Badge 
                        variant={task.status === "completed" ? "success" : "warning"}
                        className="font-black uppercase text-[8px] tracking-[0.12em] px-3 py-1.5 rounded-full border-none shadow-inner"
                      >
                        {task.status === "completed" ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> COMPLETED</span>
                        ) : (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-600 animate-pulse" /> ACTION NEEDED</span>
                        )}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-black text-zinc-900 uppercase italic tracking-tight line-clamp-2 mt-2">
                      {task.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-6">
                    <p className="text-zinc-650 text-xs leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </CardContent>
                  <CardFooter className="bg-zinc-50 p-4 border-t border-zinc-100">
                    {task.status === "pending" ? (
                      <Button 
                        onClick={() => handleUpdateStatus(task, "completed")}
                        className="w-full rounded-2xl h-11 bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all hover:scale-[1.01]"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Operation
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleUpdateStatus(task, "pending")}
                        variant="ghost"
                        className="w-full rounded-2xl h-11 text-zinc-500 hover:text-zinc-800 font-extrabold uppercase text-[9px] tracking-widest hover:bg-zinc-100 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-3 w-3" /> Re-open Operation
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="rounded-[2.2rem] border-2 border-dashed border-zinc-250 border-zinc-200 py-16 text-center shadow-none flex flex-col items-center justify-center max-w-sm mx-auto bg-white/50">
          <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-4">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="font-black uppercase italic tracking-tight text-zinc-700 text-sm">Dashboard Clear</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-2 max-w-xs px-4">
            You don't have any pending assignments here. Relax or check your Delivery manifestations.
          </p>
        </Card>
      )}
    </div>
  );
};
