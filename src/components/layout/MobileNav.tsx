import { Home, Search, ShoppingCart, User, Store, MessageSquare, Truck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();
  const { user, isSeller, isAdmin, isDeliveryAgent } = useAuth();
  const { items } = useCart();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Products", path: "/products" },
    ...(user ? [{ icon: MessageSquare, label: "Messages", path: "/messages" }] : []),
    { icon: ShoppingCart, label: "Cart", path: "/cart", badge: items.length },
    ...(isAdmin 
      ? [{ icon: Store, label: "Admin", path: "/admin/dashboard" }]
      : isSeller
      ? [{ icon: Store, label: "Seller", path: "/seller/dashboard" }]
      : isDeliveryAgent
      ? [{ icon: Truck, label: "Delivery", path: "/delivery/dashboard" }]
      : []
    ),
    { icon: User, label: user ? "Profile" : "Sign In", path: user ? "/profile" : "/auth" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="grid grid-cols-5 gap-1 py-2 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors relative",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                    variant="destructive"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
