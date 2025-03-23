import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Search, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Store, 
  Settings,
  List,
  X
} from "lucide-react";
import { SlideUpTransition } from "@/hooks/useTransition";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/cashier":
        return "Cashier";
      case "/products":
        return "Products";
      case "/transactions":
        return "Transactions";
      case "/store":
        return "Store";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const getPageIcon = () => {
    switch (location.pathname) {
      case "/":
        return <LayoutDashboard className="h-5 w-5" />;
      case "/cashier":
        return <ShoppingCart className="h-5 w-5" />;
      case "/products":
        return <Package className="h-5 w-5" />;
      case "/transactions":
        return <List className="h-5 w-5" />;
      case "/store":
        return <Store className="h-5 w-5" />;
      case "/settings":
        return <Settings className="h-5 w-5" />;
      default:
        return <LayoutDashboard className="h-5 w-5" />;
    }
  };

  const dispatchSearchEvent = useCallback((query: string) => {
    // Dispatch a custom event that the page components will listen for
    const searchEvent = new CustomEvent('app-search', { detail: query });
    window.dispatchEvent(searchEvent);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle search based on current page
    if (location.pathname === "/products" || location.pathname === "/transactions" || location.pathname === "/cashier") {
      dispatchSearchEvent(searchQuery);
      setSearchOpen(false);
    } else {
      // If we're not on a searchable page, navigate to products by default
      navigate('/products');
      // Delay dispatching the event slightly to ensure the page has loaded
      setTimeout(() => dispatchSearchEvent(searchQuery), 100);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-background/70 border-b">
      <div className="container px-2 sm:px-6 flex h-14 md:h-16 items-center justify-between">
        <div className="flex gap-2 md:gap-4 items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center gap-2 animate-slide-down">
            {getPageIcon()}
            <h1 className={cn("font-medium", isMobile ? "text-base" : "text-lg")}>{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SlideUpTransition show={searchOpen} className="relative">
            <form onSubmit={handleSearch} className={cn("absolute right-0 top-0", isMobile ? "w-52" : "w-64", "h-10")}>
              <div className="w-full h-full bg-white dark:bg-black rounded-md border shadow-sm flex items-center px-3">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </SlideUpTransition>
          
          {!searchOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchOpen(true)} 
              className={cn("transition-all", searchOpen && "opacity-0")}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
