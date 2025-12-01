import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  full_name: string | null;
  email: string;
  business_name: string | null;
}

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Chat {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`chat_${selectedChatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${selectedChatId}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChatId]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, business_name")
      .neq("id", user?.id);

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching chats:", errorMessage);
      toast({
        title: "Error",
        description: "Failed to fetch chats",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    if (!selectedChatId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark messages as read
      const unreadMessages = (data || []).filter(m => !m.read && m.sender_id !== user?.id);
      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadMessages.map(m => m.id));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching messages:", errorMessage);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleUserSelect = async (selectedUser: User) => {
    if (!user) return;

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) =>
        (chat.buyer_id === user.id && chat.seller_id === selectedUser.id) ||
        (chat.seller_id === user.id && chat.buyer_id === selectedUser.id)
    );

    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setSelectedUserId(selectedUser.id);
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from("chats")
        .insert({
          buyer_id: user.id,
          seller_id: selectedUser.id,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create chat",
          variant: "destructive",
        });
      } else {
        setSelectedChatId(data.id);
        setSelectedUserId(selectedUser.id);
        fetchChats();
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedChatId) return;

    try {
      const { error: insertError } = await supabase.from("messages").insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        body: newMessage.trim(),
        read: false,
      });

      if (insertError) throw insertError;

      setNewMessage("");
      
      // Update chat's last_message
      const { error: updateError } = await supabase
        .from("chats")
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", selectedChatId);

      if (updateError) throw updateError;

      await fetchChats();
      await fetchMessages();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to send message: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const getOtherUser = (chat: Chat) => {
    const otherUserId = chat.buyer_id === user?.id ? chat.seller_id : chat.buyer_id;
    return users.find((u) => u.id === otherUserId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Existing Chats */}
                {chats.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Recent Chats</h3>
                    <div className="space-y-2">
                      {chats.map((chat) => {
                        const otherUser = getOtherUser(chat);
                        if (!otherUser) return null;
                        return (
                          <Button
                            key={chat.id}
                            variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setSelectedChatId(chat.id);
                              setSelectedUserId(otherUser.id);
                            }}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-semibold">
                                {otherUser.full_name || otherUser.business_name || otherUser.email}
                              </div>
                              {chat.last_message && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {chat.last_message}
                                </div>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* All Users */}
                {users.length === 0 ? (
                  <p className="text-muted-foreground">No users available</p>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">All Users</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {users.map((u) => (
                        <Button
                          key={u.id}
                          variant={selectedUserId === u.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => handleUserSelect(u)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold">
                              {u.full_name || u.business_name || u.email}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2">
            {selectedChatId && selectedUserId ? (
              <Card className="flex flex-col h-[600px]">
                <CardHeader>
                  <CardTitle>
                    {users.find((u) => u.id === selectedUserId)?.full_name ||
                      users.find((u) => u.id === selectedUserId)?.business_name ||
                      users.find((u) => u.id === selectedUserId)?.email}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="text-sm font-semibold mb-1">
                            {message.sender_id === user?.id
                              ? "You"
                              : message.profiles?.full_name || message.profiles?.email}
                          </div>
                          <div className="break-words">{message.body}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-[600px] border rounded-lg">
                <p className="text-muted-foreground">
                  Select a user to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
