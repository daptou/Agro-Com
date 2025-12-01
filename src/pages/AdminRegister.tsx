import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const AdminRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAdminSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const adminSecret = formData.get("adminSecret") as string;

    try {
      // Call server-side edge function to securely register admin
      const { data, error } = await supabase.functions.invoke('register-admin', {
        body: {
          email,
          password,
          fullName,
          adminSecret
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create admin account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign in the newly created admin
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast({
        title: "Admin Account Created!",
        description: "Welcome to AgroCom Admin",
      });

      navigate("/");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-white">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            AgroCom Admin
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Registration
            </CardTitle>
            <CardDescription>
              Create an admin account with full system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSignUp} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Admin Name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@agrocom.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="adminSecret">Admin Setup Secret</Label>
                <Input
                  id="adminSecret"
                  name="adminSecret"
                  type="password"
                  placeholder="Enter admin secret"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact system administrator for the admin secret
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Admin Account..." : "Create Admin Account"}
              </Button>
              <div className="text-center text-sm">
                <Link to="/auth" className="text-primary hover:underline">
                  Back to regular sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegister;
