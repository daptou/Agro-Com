import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

export const NotificationBar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
    };
    fetchNotifications();
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  if (!user) return null;
  return (
    <div className="fixed top-0 right-0 z-50 w-full max-w-sm p-2">
      <div className="bg-card rounded-lg shadow-lg p-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <span className="font-bold">Notifications</span>
        <div className="flex-1">
          {notifications.length === 0 ? (
            <span className="text-muted-foreground text-xs">No notifications</span>
          ) : (
            <ul className="text-xs space-y-1">
              {notifications.slice(0, 5).map(n => (
                <li key={n.id} className="font-medium">{n.title}: {n.message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
