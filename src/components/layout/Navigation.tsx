
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  List, 
  Store, 
  Settings, 
  ChevronRight,
  LogOut,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideUpTransition } from "@/hooks/useTransition";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navigationItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Cashier",
      path: "/cashier",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      name: "Products",
      path: "/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <List className="h-5 w-5" />,
    },
    {
      name: "Store",
      path: "/store",
      icon: <Store className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    // Implement logout functionality here
    console.log("Logging out...");
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar backdrop-blur-sm transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobile ? "w-[85vw] max-w-[280px]" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 md:h-16 items-center border-b px-6">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">Cashier App</h2>
        </div>
        
        <div className="flex flex-col space-y-1 p-2">
          {navigationItems.map((item, index) => (
            <SlideUpTransition 
              key={item.path}
              show={true} 
              duration={300 + index * 50}
            >
              <NavLink
                to={item.path}
                onClick={() => {
                  if (isMobile) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-sidebar-accent text-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )
                }
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <span className="mr-3 transition-all duration-200 group-hover:text-primary">
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-all duration-200",
                    location.pathname === item.path ? "opacity-100" : "opacity-0"
                  )} />
                </div>
              </NavLink>
            </SlideUpTransition>
          ))}
        </div>
        
        <div className="absolute bottom-0 w-full p-4 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
