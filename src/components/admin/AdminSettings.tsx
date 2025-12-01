import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "",
    siteDescription: "",
    contactEmail: "",
    paystackPublic: "",
    paystackSecret: "",
    paystackTestPublic: "pk_test_8da2a72e7d7c9cbc89c2a714ee9530b8e82fb328",
    paystackTestSecret: "sk_test_617bcdb289aea39db3a2a52c53dc95f631de7fa3",
    paystackTestMode: false,
  });

  useEffect(() => {
    // Force Paystack test keys and test mode in DB
    (async () => {
      await supabase.from("site_settings").upsert([
        { key: "paystack_test_public_key", value: "pk_test_8da2a72e7d7c9cbc89c2a714ee9530b8e82fb328" },
        { key: "paystack_test_secret_key", value: "sk_test_617bcdb289aea39db3a2a52c53dc95f631de7fa3" },
        { key: "paystack_test_mode", value: true },
      ], { onConflict: "key" });
      fetchSettings();
    })();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "site_name",
          "site_description",
          "contact_email",
          "paystack_public_key",
          "paystack_secret_key",
          "paystack_test_public_key",
          "paystack_test_secret_key",
          "paystack_test_mode",
        ]);

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      setSettings({
        siteName: settingsMap.site_name || "",
        siteDescription: settingsMap.site_description || "",
        contactEmail: settingsMap.contact_email || "",
        paystackPublic: settingsMap.paystack_public_key || "",
        paystackSecret: settingsMap.paystack_secret_key || "",
        paystackTestPublic: settingsMap.paystack_test_public_key || "",
        paystackTestSecret: settingsMap.paystack_test_secret_key || "",
        paystackTestMode: settingsMap.paystack_test_mode === true || settingsMap.paystack_test_mode === "true",
      });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = [
        { key: "site_name", value: settings.siteName },
        { key: "site_description", value: settings.siteDescription },
        { key: "contact_email", value: settings.contactEmail },
      ];

      for (const update of updates) {
        await supabase
          .from("site_settings")
          .upsert(update, { onConflict: "key" });
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
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

  const handlePaymentSave = async () => {
    setLoading(true);
    try {
      const updates = [
        { key: "paystack_public_key", value: settings.paystackPublic },
        { key: "paystack_secret_key", value: settings.paystackSecret },
        { key: "paystack_test_public_key", value: settings.paystackTestPublic },
        { key: "paystack_test_secret_key", value: settings.paystackTestSecret },
        { key: "paystack_test_mode", value: settings.paystackTestMode },
      ];

      for (const update of updates) {
        await supabase
          .from("site_settings")
          .upsert(update, { onConflict: "key" });
      }

      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your site configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input 
              id="siteName" 
              placeholder="Your Site Name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Input 
              id="siteDescription" 
              placeholder="Site description for SEO"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input 
              id="contactEmail" 
              type="email" 
              placeholder="contact@example.com"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure Paystack integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="testMode"
              checked={settings.paystackTestMode}
              onChange={(e) => setSettings({ ...settings, paystackTestMode: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="testMode" className="cursor-pointer">
              Test Mode (Use test keys for development)
            </Label>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Live Keys</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paystackPublic">Paystack Public Key (Live)</Label>
                <Input 
                  id="paystackPublic" 
                  placeholder="pk_live_..."
                  value={settings.paystackPublic}
                  onChange={(e) => setSettings({ ...settings, paystackPublic: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paystackSecret">Paystack Secret Key (Live)</Label>
                <Input 
                  id="paystackSecret" 
                  type="password" 
                  placeholder="sk_live_..."
                  value={settings.paystackSecret}
                  onChange={(e) => setSettings({ ...settings, paystackSecret: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Test Keys</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paystackTestPublic">Paystack Public Key (Test)</Label>
                <Input 
                  id="paystackTestPublic" 
                  placeholder="pk_test_..."
                  value={settings.paystackTestPublic}
                  onChange={(e) => setSettings({ ...settings, paystackTestPublic: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paystackTestSecret">Paystack Secret Key (Test)</Label>
                <Input 
                  id="paystackTestSecret" 
                  type="password" 
                  placeholder="sk_test_..."
                  value={settings.paystackTestSecret}
                  onChange={(e) => setSettings({ ...settings, paystackTestSecret: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button onClick={handlePaymentSave} disabled={loading}>
            {loading ? "Saving..." : "Save Payment Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
