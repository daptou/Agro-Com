import { supabase } from "@/integrations/supabase/client";

export async function forceSetPaystackTestKeys() {
  await supabase.from("site_settings").upsert([
    { key: "paystack_test_public_key", value: "pk_test_8da2a72e7d7c9cbc89c2a714ee9530b8e82fb328" },
    { key: "paystack_test_secret_key", value: "sk_test_617bcdb289aea39db3a2a52c53dc95f631de7fa3" },
    { key: "paystack_test_mode", value: true },
  ], { onConflict: "key" });
}

// To use: import and call forceSetPaystackTestKeys() once on app start or admin login.
