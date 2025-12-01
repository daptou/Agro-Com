import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { forceSellerRoles } from "@/lib/forceSellerRoles";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export const AdminUsers = ({ onRefresh }: { onRefresh: () => void }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleForceSellerRoles = async () => {
    await forceSellerRoles();
    fetchUsers();
    toast({ title: "Seller roles updated" });
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);
          
          return {
            ...profile,
            role: roles && roles.length > 0 ? roles.map(r => r.role).join(", ") : "buyer",
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    // Delete from user_roles, orders, products, delivery_jobs, notifications, then profiles
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("orders").delete().eq("buyer_id", userId);
    await supabase.from("products").delete().eq("seller_id", userId);
    await supabase.from("delivery_jobs").delete().eq("delivery_agent_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (!error) {
      toast({ title: "User deleted" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  const handleChangeRole = async (userId: string, newRole: string) => {
    // Remove all roles for user, then insert new role
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert([{ user_id: userId, role: newRole as any }]);
    toast({ title: "Role updated" });
    fetchUsers();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <Button onClick={handleForceSellerRoles} className="mt-2">Force Seller Roles</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role || "buyer"}
                  </Badge>
                  <select
                    value={user.role.split(",")[0]}
                    onChange={e => handleChangeRole(user.id, e.target.value)}
                    className="ml-2 border rounded px-2 py-1 text-xs"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="delivery_agent">Delivery Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
