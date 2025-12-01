import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  quantity: number;
  created_at: string;
  products: { title: string } | null;
  profiles: { full_name: string; email: string } | null;
}

export const OrdersList = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          products (title),
          profiles!orders_buyer_id_fkey (full_name, email)
        `
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{order.products?.title || "Product"}</h3>
                <p className="text-sm text-muted-foreground">
                  Buyer: {order.profiles?.full_name || order.profiles?.email}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={order.status === "pending" ? "secondary" : "default"}>{order.status}</Badge>
                <Badge variant={order.payment_status === "completed" ? "default" : "secondary"} className="ml-2">
                  {order.payment_status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Qty: {order.quantity}</span>
              <span className="font-semibold">NGN {order.total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
