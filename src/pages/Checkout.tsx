import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type ShippingAddress = {
  fullName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
};

type OrderInsertPayload = {
  buyer_id: string;
  seller_id: string | number;
  product_id: string | number;
  quantity: number;
  total: number;
  shipping_address: ShippingAddress;
  notes?: string;
  status: string;
  payment_status: string;
};

const Checkout: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () =>
      toast({ title: "Error", description: "Failed to load payment script", variant: "destructive" });
    document.body.appendChild(script);
  }, [toast]);

  useEffect(() => {
    if (!user || items.length === 0) navigate("/cart");
  }, [user, items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "fullName";
    if (!formData.email.trim() || !formData.email.includes("@")) return "email";
    if (!formData.phone.trim()) return "phone";
    if (!formData.address.trim()) return "address";
    if (!formData.city.trim()) return "city";
    if (!formData.state.trim()) return "state";
    return null;
  };

  const formatNaira = (value: number) => `₦${value.toLocaleString()}`;
  const makeReference = () => `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const handlePayment = async () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast({
        title: "Payment not ready",
        description: "Payment system is still loading. Wait a moment.",
        variant: "destructive",
      });
      return;
    }

    const invalid = validateForm();
    if (invalid) {
      toast({ title: "Missing info", description: `Please fill ${invalid} field`, variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Not signed in", description: "Please log in first", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast({ title: "Empty cart", description: "Add items before checkout", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const orders: any[] = [];

      for (const item of items) {
        const payload = {
          buyer_id: user.id,
          seller_id: item.product?.seller_id || null,
          product_id: item.product_id,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
          shipping_address: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            phone: formData.phone,
          },
          notes: formData.notes,
          status: "pending" as const,
          payment_status: "pending" as const,
        };

        const { data: orderData, error } = await supabase.from("orders").insert([payload]).select().single();
        if (error) throw new Error("Order creation failed");
        orders.push(orderData);
      }

      const paymentRef = makeReference();
      const orderIds = orders.map((o) => o.id);

      const handler = window.PaystackPop.setup({
        key: "pk_test_8da2a72e7d7c9cbc89c2a714ee9530b8e82fb328", // TEST KEY
        email: formData.email,
        amount: Math.round(totalPrice * 100),
        ref: paymentRef,
        currency: "NGN",
        metadata: {
          custom_fields: [
            { display_name: "Order IDs", variable_name: "order_ids", value: orderIds.join(",") },
            { display_name: "Customer Name", variable_name: "customer_name", value: formData.fullName },
            { display_name: "Test Mode", variable_name: "test_mode", value: "true" },
          ],
        },
        callback: function(response: any) {
          // Use regular function instead of async arrow function
          const processPayment = async () => {
            try {
              const updates = orders.map((ord) =>
                supabase
                  .from("orders")
                  .update({
                    payment_status: "completed",
                    status: "confirmed",
                    payment_provider: "paystack",
                    transaction_reference: response.reference,
                  })
                  .eq("id", ord.id)
              );
              await Promise.all(updates);
              await clearCart();
              toast({ title: "Payment successful", description: `Reference: ${response.reference}` });
              navigate("/");
            } catch (err) {
              console.error("Payment processing error:", err);
              toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
            }
          };
          processPayment();
        },
        onClose: function() {
          toast({ title: "Payment cancelled", description: "You closed the payment window", variant: "destructive" });
        },
      });

      handler.openIframe();
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Full Name *</Label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} />

                <Label>Email *</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />

                <Label>Phone *</Label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} />

                <Label>Address *</Label>
                <Input name="address" value={formData.address} onChange={handleInputChange} />

                <Label>City *</Label>
                <Input name="city" value={formData.city} onChange={handleInputChange} />

                <Label>State *</Label>
                <Input name="state" value={formData.state} onChange={handleInputChange} />

                <Label>Notes</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product?.title} × {item.quantity}</span>
                    <span>{formatNaira(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(totalPrice)}</span>
                </div>
                <Button className="w-full mt-4" onClick={handlePayment} disabled={loading}>
                  {loading ? "Processing..." : "Pay with Paystack"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
