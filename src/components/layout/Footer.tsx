import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted mt-auto">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">AgroCom</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connecting farmers with buyers across Nigeria. Fresh produce, quality livestock, and agricultural supplies delivered to your doorstep.
            </p>
            <div className="flex gap-2">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">Browse Products</Link></li>
              <li><Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">Categories</Link></li>
              <li><Link to="/sellers" className="text-muted-foreground hover:text-primary transition-colors">Our Sellers</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-bold text-lg mb-4">For Sellers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/auth?role=seller" className="text-muted-foreground hover:text-primary transition-colors">Become a Seller</Link></li>
              <li><Link to="/seller/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Seller Dashboard</Link></li>
              <li><Link to="/help/seller" className="text-muted-foreground hover:text-primary transition-colors">Seller Guide</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@agrocom.ng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+234 800 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AgroCom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
