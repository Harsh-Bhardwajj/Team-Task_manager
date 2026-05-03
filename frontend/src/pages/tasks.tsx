import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Plus, Filter, Search } from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { 
  useListTasks, 
  useListProjects,
  useListUsers,
  useCreateTask,
  getListTasksQueryKey
} from "@workspace/api-client-react";
import { ListTasksStatus, ListTasksPriority } from "@workspace/api-client-react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  projectId: z.string().min(1, "Project is required"),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().nullable().optional(),
});

export default function Tasks() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ListTasksStatus | undefined>(undefined);
  const [priority, setPriority] = useState<ListTasksPriority | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: taskData, isLoading } = useListTasks({
    page,
    limit: 10,
    status,
    priority,
    assignedTo,
    search: searchDebounced || undefined,
  }, { query: { queryKey: getListTasksQueryKey({ page, limit: 10, status, priority, assignedTo, search: searchDebounced || undefined }) } });

  const { data: users } = useListUsers();

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage and track all tasks across projects.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? undefined : v as ListTasksStatus)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority || "all"} onValueChange={(v) => setPriority(v === "all" ? undefined : v as ListTasksPriority)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignedTo || "all"} onValueChange={(v) => setAssignedTo(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Assignee</SelectItem>
                {users?.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(status || priority || assignedTo || search) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setStatus(undefined);
                  setPriority(undefined);
                  setAssignedTo(undefined);
                  setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : taskData?.tasks.length ? (
          <div className="space-y-4">
            {taskData.tasks.map((task) => {
              const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <Card className={cn("hover:bg-muted/30 transition-colors cursor-pointer group", isOverdue && "border-destructive/30 bg-destructive/5")}>
                    <CardContent className="p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{task.title}</span>
                          {isOverdue && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Overdue</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{task.projectName}</span>
                          <span className="hidden sm:inline">•</span>
                          {task.assignedToName ? (
                            <span>{task.assignedToName}</span>
                          ) : (
                            <span className="italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={
                          task.priority === "high" ? "destructive" :
                          task.priority === "medium" ? "default" : "secondary"
                        }>
                          {task.priority}
                        </Badge>
                        <Badge variant={
                          task.status === "completed" ? "default" :
                          task.status === "in-progress" ? "secondary" : "outline"
                        } className={task.status === "completed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {task.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground w-24 text-right">
                          {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No date"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            
            {taskData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, taskData.total)} of {taskData.total} tasks
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(taskData.totalPages, p + 1))}
                    disabled={page === taskData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/10">
            <Filter className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Try adjusting your filters or create a new task.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createTask = useCreateTask();
  const { data: projects } = useListProjects();
  const { data: users } = useListUsers();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assignedTo: null,
      dueDate: null,
    },
  });

  function onSubmit(values: z.infer<typeof taskSchema>) {
    createTask.mutate(
      { 
        data: {
          ...values,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          assignedTo: values.assignedTo || null
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          toast({ title: "Task created successfully" });
          onSuccess();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create task" });
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4 md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task details..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === "unassigned" ? null : v)} value={field.value || "unassigned"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
