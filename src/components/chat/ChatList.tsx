import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  product_id: string;
  products: {
    title: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
}

export const ChatList = ({ onChatSelect }: ChatListProps) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chats")
      .select(`
        *,
        products(title),
        profiles!chats_buyer_id_fkey(full_name, email)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
    } else {
      setChats(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Loading chats...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chats.length === 0 ? (
          <p className="text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex-1 space-y-1">
                  <div className="font-semibold">
                    {chat.profiles?.full_name || chat.profiles?.email || "User"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {chat.products?.title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {chat.last_message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chat.last_message_at &&
                      formatDistanceToNow(new Date(chat.last_message_at), {
                        addSuffix: true,
                      })}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};