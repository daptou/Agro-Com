import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface Chat {
  id: string;
  last_message: string;
  last_message_at: string;
  products: { title: string } | null;
  profiles: { full_name: string; email: string } | null;
}

export const NegotiationsList = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          *,
          products (title),
          profiles!chats_buyer_id_fkey (full_name, email)
        `
        )
        .eq("seller_id", user.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading negotiations...</div>;
  }

  if (chats.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No negotiations yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {chats.map((chat) => (
        <Card key={chat.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{chat.products?.title || "Product"}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  With: {chat.profiles?.full_name || chat.profiles?.email}
                </p>
                {chat.last_message && <p className="text-sm">{chat.last_message}</p>}
              </div>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
