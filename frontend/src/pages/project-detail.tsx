import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetProject, 
  useDeleteProject, 
  useGetCurrentUser, 
  getListProjectsQueryKey,
  useListTasks,
  useListUsers,
  useAddProjectMember,
  useRemoveProjectMember,
  getGetProjectQueryKey,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FolderKanban, Users, ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useGetCurrentUser();
  const isAdmin = user?.role === "admin";

  const { data: project, isLoading } = useGetProject(projectId, { 
    query: { queryKey: getGetProjectQueryKey(projectId), enabled: !!projectId } 
  });

  const { data: taskData, isLoading: isLoadingTasks } = useListTasks({ projectId });
  
  const { data: allUsers } = useListUsers({ query: { queryKey: getListUsersQueryKey(), enabled: isAdmin } });

  const deleteProject = useDeleteProject();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");

  const handleDelete = () => {
    deleteProject.mutate(
      { projectId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project deleted" });
          setLocation("/projects");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to delete project" });
        }
      }
    );
  };

  const handleAddMember = () => {
    if (!selectedUserToAdd) return;
    addMember.mutate(
      { projectId, data: { userId: selectedUserToAdd } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Member added" });
          setIsAddMemberOpen(false);
          setSelectedUserToAdd("");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to add member" });
        }
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(
      { projectId, userId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Member removed" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to remove member" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!project) return null;

  const nonMembers = allUsers?.filter(u => !project.members.some(m => m.id === u.id)) || [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <FolderKanban className="h-8 w-8 text-primary" />
                {project.name}
              </h1>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the project and all of its tasks. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleteProject.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <p className="text-muted-foreground mt-2">{project.description}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Link href={`/tasks?projectId=${project.id}`}>
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : taskData?.tasks.length ? (
                  <div className="space-y-3">
                    {taskData.tasks.slice(0, 5).map(task => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge variant={
                            task.status === "completed" ? "default" :
                            task.status === "in-progress" ? "secondary" : "outline"
                          } className={task.status === "completed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {task.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Team Members
                </CardTitle>
                {isAdmin && (
                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Select value={selectedUserToAdd} onValueChange={setSelectedUserToAdd}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {nonMembers.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                            {nonMembers.length === 0 && (
                              <SelectItem value="none" disabled>No more users available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end">
                          <Button onClick={handleAddMember} disabled={!selectedUserToAdd || addMember.isPending}>
                            {addMember.isPending ? "Adding..." : "Add Member"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMember.isPending}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {project.members.length === 0 && (
                    <p className="text-sm text-muted-foreground">No team members assigned.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
