import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/auth";

import { 
  useGetCurrentUser, 
  useListUsers, 
  useUpdateUserRole,
  useUpdateUserProfile,
  getListUsersQueryKey,
  getGetCurrentUserQueryKey
} from "@workspace/api-client-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: dbUser, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const updateUserRole = useUpdateUserRole();
  const updateProfile = useUpdateUserProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const isAdmin = dbUser?.role === "admin";

  const handleRoleChange = (userId: string, newRole: "admin" | "member") => {
    updateUserRole.mutate(
      { data: { targetUserId: userId, role: newRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          if (userId === dbUser?.id) {
            queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          }
          toast({ title: "Role updated successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update role" });
        }
      }
    );
  };

  const handleEditName = () => {
    setNameInput(dbUser?.name ?? "");
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    updateProfile.mutate(
      { data: { name: nameInput.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({ title: "Display name updated" });
          setIsEditingName(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update name" });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and team preferences.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {dbUser?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dbUser?.name}</h3>
                  <p className="text-muted-foreground text-sm">{dbUser?.email}</p>
                </div>
              </div>

              {isLoadingUser ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground font-medium">System Role:</span>
                  <Badge variant={dbUser?.role === "admin" ? "default" : "secondary"}>
                    {dbUser?.role}
                  </Badge>
                </div>
              )}

              <div className="pt-2 space-y-3">
                {isEditingName ? (
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="display-name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your display name"
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveName} disabled={updateProfile.isPending || !nameInput.trim()}>
                        {updateProfile.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEditName}>
                    Edit Display Name
                  </Button>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await signOut();
                    queryClient.clear();
                    toast({ title: "Signed out" });
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage roles for all team members.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                      <div className="col-span-5">User</div>
                      <div className="col-span-4">Email</div>
                      <div className="col-span-3">Role</div>
                    </div>
                    <div className="divide-y">
                      {users?.map(user => (
                        <div key={user.id} className="grid grid-cols-12 gap-4 p-3 items-center text-sm hover:bg-muted/30 transition-colors">
                          <div className="col-span-5 font-medium flex items-center gap-2 truncate">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <span className="truncate">{user.name}</span>
                          </div>
                          <div className="col-span-4 text-muted-foreground truncate">
                            {user.email}
                          </div>
                          <div className="col-span-3">
                            <Select 
                              defaultValue={user.role} 
                              onValueChange={(val: "admin"|"member") => handleRoleChange(user.id, val)}
                              disabled={updateUserRole.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
