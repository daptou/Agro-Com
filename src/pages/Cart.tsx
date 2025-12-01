import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";

const Cart = () => {
  const { items, loading, updateQuantity, removeFromCart, totalPrice } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>Loading cart...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                        {item.product.images && item.product.images[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ₦{item.product.price.toLocaleString()} per {item.product.unit}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold">
                              ₦{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Order Summary</h2>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg mb-4">
                      <span>Total</span>
                      <span className="text-primary">₦{totalPrice.toLocaleString()}</span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate("/checkout")}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/products")}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
