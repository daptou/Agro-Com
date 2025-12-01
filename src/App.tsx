import { Toaster } from "@/components/ui/toaster";
import { NotificationBar } from "@/components/ui/NotificationBar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { MobileNav } from "./components/layout/MobileNav";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SellerDashboard from "./pages/SellerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import DeliveryAgentRegister from "./pages/DeliveryAgentRegister";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationBar />
          <BrowserRouter>
            <div className="pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/delivery/register" element={<DeliveryAgentRegister />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <MobileNav />
              <PWAInstallPrompt />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
