import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, isSeller, isDeliveryAgent } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left">
            <nav className="flex flex-col gap-4 mt-8">
              <Link to="/products" className="text-lg font-medium hover:text-primary transition-colors">
                Products
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}

              {isSeller && (
                <Link
                  to="/seller/dashboard"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Seller Dashboard
                </Link>
              )}

              {isDeliveryAgent && (
                <Link
                  to="/delivery/dashboard"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Delivery Dashboard
                </Link>
              )}

              {user && (
                <>
                  <Link
                    to="/messages"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Messages
                  </Link>

                  <Link
                    to="/notifications"
                    className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Bell className="h-5 w-5 text-primary" /> Notifications
                  </Link>
                </>
              )}

              {user && (
                <button
                  onClick={handleLogout}
                  className="text-lg font-medium hover:text-primary transition-colors text-left"
                >
                  Logout
                </button>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl ml-2 md:ml-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white">
            <span>A</span>
          </div>
          <span className="hidden sm:inline-block">AgroCom</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 ml-8">
          <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
            Products
          </Link>

          {isAdmin && (
            <Link to="/admin/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Admin Dashboard
            </Link>
          )}

          {isSeller && (
            <Link to="/seller/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Seller Dashboard
            </Link>
          )}

          {isDeliveryAgent && (
            <Link to="/delivery/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Delivery Dashboard
            </Link>
          )}

          {user && (
            <Link to="/messages" className="text-sm font-medium hover:text-primary transition-colors">
              Messages
            </Link>
          )}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" asChild>
                <Link to="/notifications">
                  <Bell className="h-5 w-5 text-primary" />
                </Link>
              </Button>

              {!isSeller && (
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {totalItems}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {isSeller && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/seller/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {isDeliveryAgent && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/delivery/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Delivery Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/auth">
                  <User className="h-5 w-5" />
                </Link>
              </Button>

              <Button asChild className="hidden md:flex gradient-primary">
                <Link to="/auth">Sign In / Sign Up</Link>
              </Button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
