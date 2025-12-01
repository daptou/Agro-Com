import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, ShoppingCart, MessageSquare, Package, Star } from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(full_name, phone, location_city, location_state),
          category:categories(name)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    await addToCart(product.id, quantity);
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to proceed",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    await addToCart(product.id, quantity);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.category && (
              <Badge variant="secondary">{product.category.name}</Badge>
            )}
            
            <h1 className="text-3xl font-bold">{product.title}</h1>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">per {product.unit}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="capitalize">{product.condition}</Badge>
              <span className="text-muted-foreground">
                {product.quantity} {product.unit} available
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                  max={product.quantity}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={handleBuyNow}>
                Buy Now
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>

            {/* Seller Info */}
            {product.seller && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Seller Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span> {product.seller.full_name}
                    </p>
                    {product.seller.phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {product.seller.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {product.location_city || product.seller.location_city}, {product.location_state || product.seller.location_state}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Seller
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description || "No description available."}
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
