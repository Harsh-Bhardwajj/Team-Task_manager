import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Trash2, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { AppLayout } from "@/components/layout/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { 
  useGetTask, 
  useUpdateTask, 
  useDeleteTask, 
  useListUsers,
  useGetCurrentUser,
  getGetTaskQueryKey,
  getListTasksQueryKey
} from "@workspace/api-client-react";

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().nullable().optional(),
});

export default function TaskDetail() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  const { data: user } = useGetCurrentUser();
  const { data: users } = useListUsers();
  
  const { data: task, isLoading } = useGetTask(taskId, {
    query: { queryKey: getGetTaskQueryKey(taskId), enabled: !!taskId }
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || task?.assignedTo === user?.id;

  const form = useForm<z.infer<typeof updateTaskSchema>>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assignedTo: null,
      dueDate: null,
    },
  });

  const startEditing = () => {
    if (!task) return;
    form.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    });
    setIsEditing(true);
  };

  const onSubmit = (values: z.infer<typeof updateTaskSchema>) => {
    updateTask.mutate(
      {
        taskId,
        data: {
          ...values,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          assignedTo: values.assignedTo || null
        }
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetTaskQueryKey(taskId), data);
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          toast({ title: "Task updated" });
          setIsEditing(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update task" });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(
      { taskId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          toast({ title: "Task deleted" });
          setLocation("/tasks");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to delete task" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center py-20">Task not found</div>
        </div>
      </AppLayout>
    );
  }

  const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1 flex justify-between items-center">
            <div className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              {task.projectName}
            </div>
            
            {!isEditing && canEdit && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this task. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                          {deleteTask.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Task</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Textarea className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                                <SelectValue />
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

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={updateTask.isPending}>
                      {updateTask.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-2xl font-bold leading-tight">{task.title}</CardTitle>
                    {isOverdue && <Badge variant="destructive" className="shrink-0">Overdue</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {task.description}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={
                      task.status === "completed" ? "default" :
                      task.status === "in-progress" ? "secondary" : "outline"
                    } className={task.status === "completed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {task.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <Badge variant={
                      task.priority === "high" ? "destructive" :
                      task.priority === "medium" ? "default" : "secondary"
                    }>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assignee</p>
                    <p className="font-medium text-sm">{task.assignedToName || "Unassigned"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                    <p className={cn("font-medium text-sm", isOverdue && "text-destructive")}>
                      {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm">{format(new Date(task.createdAt), "PPP")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
