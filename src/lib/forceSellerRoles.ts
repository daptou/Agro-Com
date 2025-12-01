import { supabase } from "@/integrations/supabase/client";

export async function forceSellerRoles() {
  // Get all users who have products
  const { data: products } = await supabase.from("products").select("seller_id");
  const sellerIds = Array.from(new Set((products || []).map(p => p.seller_id)));
  // Upsert seller role for each seller
  await Promise.all(sellerIds.map(async (id) => {
    await supabase.from("user_roles").upsert({ user_id: id, role: "seller" }, { onConflict: "user_id,role" });
  }));
}