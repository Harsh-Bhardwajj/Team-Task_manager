import { useGetDashboardSummary, useGetOverdueTasks, useListActivity } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Activity, CheckCircle2, Clock, ListTodo, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: overdue, isLoading: isLoadingOverdue } = useGetOverdueTasks();
  const { data: activity, isLoading: isLoadingActivity } = useListActivity({ limit: 10 });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your team's tasks and projects.</p>
        </div>

        {isLoadingSummary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {summary.totalProjects} projects
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.recentCompletions} completed recently
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.pendingTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>

            <Card className={summary.overdueTasks > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className={summary.overdueTasks > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.overdueTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across all projects.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-8">
                  {activity.map((log) => (
                    <div key={log.id} className="flex items-start gap-4">
                      <div className="rounded-full bg-muted p-2">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{log.userName}</span>{" "}
                          <span className="text-muted-foreground">{log.action.toLowerCase()}</span>{" "}
                          <span className="font-medium">{log.entityTitle}</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
                          {log.projectName && (
                            <>
                              <span>•</span>
                              <span>{log.projectName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-8 w-8 mb-3 opacity-50" />
                  <p>No recent activity found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Overdue Tasks</CardTitle>
              <CardDescription>Tasks past their due date.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOverdue ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : overdue && overdue.length > 0 ? (
                <div className="space-y-4">
                  {overdue.map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex flex-col gap-1 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer border-destructive/20 bg-destructive/5">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm line-clamp-1">{task.title}</span>
                          <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate max-w-[120px]">{task.projectName}</span>
                          <span>•</span>
                          <span className="text-destructive font-medium">
                            Due {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/tasks?status=pending">
                    <Button variant="outline" className="w-full mt-2">View All Tasks</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-3 opacity-50 text-emerald-500" />
                  <p>You're all caught up! No overdue tasks.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
