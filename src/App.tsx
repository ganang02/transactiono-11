
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Cashier from "./pages/Cashier";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Store from "./pages/Store";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";

const queryClient = new QueryClient();

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex h-screen overflow-hidden">
            <Navigation isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 overflow-auto">
              <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
              
              <main className="min-h-[calc(100vh-4rem)]">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cashier" element={<Cashier />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
