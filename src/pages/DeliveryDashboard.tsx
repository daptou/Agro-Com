import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryJob {
  id: string;
  order_id: string;
  pickup_address: any;
  delivery_address: any;
  status: string;
  notes: string;
  created_at: string;
  orders: {
    total: number;
  };
}

const DeliveryDashboard = () => {
  const { user, isDeliveryAgent, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isDeliveryAgent)) {
      navigate("/auth");
    }
  }, [user, isDeliveryAgent, loading, navigate]);

  useEffect(() => {
    if (user && isDeliveryAgent) {
      fetchJobs();
      fetchAvailableJobs();
    }
  }, [user, isDeliveryAgent]);

  const fetchJobs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("delivery_jobs")
      .select("*, orders(total)")
      .eq("delivery_agent_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoadingJobs(false);
  };

  const fetchAvailableJobs = async () => {
    const { data, error } = await supabase
      .from("delivery_jobs")
      .select("*, orders(total)")
      .is("delivery_agent_id", null)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching available jobs:", error);
    } else {
      setAvailableJobs(data || []);
    }
  };

  const claimJob = async (jobId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("delivery_jobs")
      .update({
        delivery_agent_id: user.id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to claim job",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job claimed successfully",
      });
      fetchJobs();
      fetchAvailableJobs();
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    const updateData: any = { status };
    if (status === "delivered") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("delivery_jobs")
      .update(updateData)
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      fetchJobs();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "assigned": return "bg-blue-500";
      case "picked_up": return "bg-purple-500";
      case "in_transit": return "bg-orange-500";
      case "delivered": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (loading || loadingJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Delivery Dashboard</h1>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableJobs.length === 0 ? (
                <p className="text-muted-foreground">No available jobs at the moment</p>
              ) : (
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">Pickup:</span>
                              <span>{job.pickup_address?.address || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">Delivery:</span>
                              <span>{job.delivery_address?.address || "N/A"}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Order Total: ₦{job.orders?.total?.toLocaleString() || 0}
                            </div>
                          </div>
                          <Button onClick={() => claimJob(job.id)}>Claim Job</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-muted-foreground">No active deliveries</p>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ₦{job.orders?.total?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">Pickup:</span>
                              <span>{job.pickup_address?.address || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">Delivery:</span>
                              <span>{job.delivery_address?.address || "N/A"}</span>
                            </div>
                          </div>
                          {job.status !== "delivered" && job.status !== "cancelled" && (
                            <div className="flex gap-2">
                              {job.status === "assigned" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateJobStatus(job.id, "picked_up")}
                                >
                                  Mark Picked Up
                                </Button>
                              )}
                              {job.status === "picked_up" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateJobStatus(job.id, "in_transit")}
                                >
                                  Mark In Transit
                                </Button>
                              )}
                              {job.status === "in_transit" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateJobStatus(job.id, "delivered")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Delivered
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DeliveryDashboard;