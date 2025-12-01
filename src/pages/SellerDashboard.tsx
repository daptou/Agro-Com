import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  images?: any;
}

const SellerDashboard = () => {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    slug: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isSeller)) {
      navigate("/auth");
    }
  }, [user, isSeller, loading, navigate]);

  useEffect(() => {
    if (user && isSeller) {
      fetchProducts();
    }
  }, [user, isSeller]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to load products: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product_images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product_images")
        .getPublicUrl(filePath);

      return urlData?.publicUrl || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Image upload error:", errorMessage);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormLoading(true);

    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-"),
        images: imageUrl ? [imageUrl] : [],
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      setForm({ title: "", description: "", price: "", slug: "" });
      setImageFile(null);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to create product: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to delete product: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (loading) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and sales</p>
            {user && (
              <Badge variant="secondary" className="mt-2">Role: Seller</Badge>
            )}
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {showForm && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Create New Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <Label>Product Title</Label>
                      <Input
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Fresh Tomatoes"
                        required
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={handleInputChange}
                        placeholder="Describe your product..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (₦)</Label>
                        <Input
                          name="price"
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <Label>Product Slug (Optional)</Label>
                        <Input
                          name="slug"
                          value={form.slug}
                          onChange={handleInputChange}
                          placeholder="auto-generated"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Product Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No products yet</p>
                  <Button onClick={() => setShowForm(true)}>Create your first product</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{product.title}</h3>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-primary">₦{Number(product.price).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">
                              Created: {new Date(product.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SellerDashboard;
