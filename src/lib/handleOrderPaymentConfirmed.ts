import { supabase } from "@/integrations/supabase/client";

export async function handleOrderPaymentConfirmed(orderId: string) {
  // 1. Create a delivery job for the order
  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (orderError || !order) return;

  // Create delivery job using shipping_address for both pickup and delivery
  await supabase.from("delivery_jobs").insert({
    order_id: orderId,
    pickup_address: { address: "Seller location" }, // You may want to fetch seller address
    delivery_address: order.shipping_address || {},
    status: "pending",
    notes: "Awaiting claim by delivery agent",
  });

  // 2. Notify admin
  await supabase.from("notifications").insert({
    user_id: "admin", // Use actual admin user id or broadcast logic
    title: "New Delivery Job Created",
    message: `Order ${orderId} payment confirmed. Delivery job is now available for claim.`,
    type: "delivery_job",
    read: false,
  });

  // 3. Notify user
  await supabase.from("notifications").insert({
    user_id: order.buyer_id,
    title: "Order Payment Confirmed",
    message: `Your order will soon be delivered. Delivery agent will claim and update you with delivery time.`,
    type: "order_status",
    read: false,
  });
}

// Call handleOrderPaymentConfirmed(orderId) when payment is confirmed.
