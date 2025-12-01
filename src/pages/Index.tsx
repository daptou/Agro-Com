import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, TrendingUp, Shield, ArrowRight, Star, Sprout, Apple, Carrot, Wheat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      if (data) setFeaturedProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const categories = [
    { name: "Grains", icon: Wheat, count: 45, color: "text-amber-600" },
    { name: "Vegetables", icon: Carrot, count: 82, color: "text-green-600" },
    { name: "Fruits", icon: Apple, count: 63, color: "text-red-600" },
    { name: "Seeds", icon: Sprout, count: 38, color: "text-primary" },
  ];

  const features = [
    {
      icon: ShoppingBag,
      title: "Wide Selection",
      description: "Access thousands of quality agricultural products from verified sellers"
    },
    {
      icon: Users,
      title: "Trusted Sellers",
      description: "Connect directly with farmers and suppliers across Nigeria"
    },
    {
      icon: TrendingUp,
      title: "Best Prices",
      description: "Negotiate fair prices and get the best deals on farm produce"
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Shop with confidence using our secure payment system"
    }
  ];

  const testimonials = [
    {
      name: "Amara Okafor",
      role: "Restaurant Owner",
      content: "AgroCom has transformed how I source fresh produce. The quality is exceptional and delivery is always on time.",
      rating: 5
    },
    {
      name: "Ibrahim Musa",
      role: "Farmer",
      content: "As a seller, this platform gave me access to buyers I never would have reached. My sales have tripled!",
      rating: 5
    },
    {
      name: "Chioma Eze",
      role: "Food Processor",
      content: "The negotiation feature is brilliant. I can communicate directly with farmers and get exactly what I need.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero text-white py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449')] bg-cover bg-center opacity-10" />
          <div className="container relative px-4">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
                Fresh From Farm to Your Doorstep
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                Nigeria's premier marketplace for agricultural products. Connect with farmers, negotiate prices, and get quality produce delivered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                  <Link to="/products">
                    Browse Products <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 border-white text-white hover:bg-white hover:text-primary">
                  <Link to="/auth?role=seller">
                    Start Selling
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-background">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link key={category.name} to={`/products?category=${category.name.toLowerCase()}`}>
                  <Card className="p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                    <category.icon className={`h-12 w-12 mx-auto mb-4 ${category.color}`} />
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} products</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose AgroCom</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Preview */}
        <section className="py-16 bg-background">
          <div className="container px-4">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
              <Button variant="ghost" asChild>
                <Link to="/products">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => {
                  const images = product.images as string[] | null;
                  const imageUrl = images && images.length > 0 ? images[0] : null;
                  
                  return (
                    <Link key={product.id} to={`/products/${product.slug}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.title} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20" />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {product.categories?.name || "Fresh from the farm"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg text-primary">
                              ₦{Number(product.price).toLocaleString()}
                            </span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-4 text-center py-8 text-muted-foreground">
                  Loading products...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary text-white">
          <div className="container px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
              Join thousands of buyers and sellers on Nigeria's most trusted agricultural marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth?role=buyer">Sign Up as Buyer</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/auth?role=seller">Register as Seller</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
