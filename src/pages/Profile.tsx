import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    business_name: "",
    location_city: "",
    location_state: "",
    avatar_url: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    amount_total: 0,
  });

  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    console.log("User loaded, fetching profile data:", user.id);
    
    const loadData = async () => {
      await fetchProfile();
      await fetchTransactionStats();
      await fetchOrderHistory();
    };

    loadData();

    // Subscribe to real-time updates on orders table
    const channel = supabase
      .channel(`orders_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          console.log("Order change detected, refreshing...");
          fetchTransactionStats();
          fetchOrderHistory();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          business_name: data.business_name || "",
          location_city: data.location_city || "",
          location_state: data.location_state || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    if (!user?.id) {
      console.warn("User ID not available for fetching stats");
      return;
    }

    try {
      console.log("Fetching transaction stats for user:", user.id);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id);

      if (error) throw error;

      console.log("Transaction stats data:", data);

      const total = data?.length || 0;
      const pending = data?.filter((t) => t.status === "pending").length || 0;
      const delivered = data?.filter((t) => t.status === "delivered").length || 0;
      const cancelled = data?.filter((t) => t.status === "cancelled").length || 0;

      const amount_total = data
        ?.filter((t) => t.status === "delivered")
        .reduce((sum: number, t: any) => sum + (Number(t.total) || 0), 0) || 0;

      setStats({ total, success: delivered, pending, failed: cancelled, amount_total });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Transaction error:", errorMessage);
      toast({ title: "Transaction Error", description: errorMessage, variant: "destructive" });
    }
  };

  const fetchOrderHistory = async () => {
    if (!user?.id) {
      console.warn("User ID not available for fetching order history");
      return;
    }

    try {
      console.log("Fetching order history for user:", user.id);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Order history data:", data);
      setOrderHistory(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading order history:", errorMessage);
      toast({
        title: "Error Loading History",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user?.id);

      if (error) throw error;

      toast({ title: "Success", description: "Profile Updated" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 text-center">Loading...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* Transaction Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
          <Card><CardHeader><CardTitle>Successful</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{stats.success}</CardContent></Card>
          <Card><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-yellow-600">{stats.pending}</CardContent></Card>
          <Card><CardHeader><CardTitle>Failed</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-600">{stats.failed}</CardContent></Card>
        </div>

        {/* Total Amount */}
        <Card className="mb-10">
          <CardHeader><CardTitle>Total Successful Amount</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">₦{stats.amount_total.toLocaleString()}</CardContent>
        </Card>

        {/* Order history list */}
        <Card className="mb-10">
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {orderHistory.length === 0 ? (
              <p className="text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">Order ID: {order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">₦{(order.total || 0).toLocaleString()}</p>

                      <span
                        className={
                          order.status === "delivered"
                            ? "text-green-600 font-semibold"
                            : order.status === "pending" || order.status === "confirmed" || order.status === "processing"
                            ? "text-yellow-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile editing */}
        <Card>
          <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={profile.business_name}
                    onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={profile.location_city}
                    onChange={(e) => setProfile({ ...profile, location_city: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={profile.location_state}
                    onChange={(e) => setProfile({ ...profile, location_state: e.target.value })} />
                </div>

              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea rows={4} value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
