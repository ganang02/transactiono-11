
import React, { useState } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Calendar, 
  ArrowRight,
  DollarSign,
  RefreshCw,
  Activity,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/api/api";
import { SlideUpTransition } from "@/hooks/useTransition";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("today");
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Updated useQuery to use onSettled instead of onError as per v5 of react-query
  const { data: dashboardData, isLoading, isRefetching, isError } = useQuery({
    queryKey: ['dashboard', selected],
    queryFn: () => DashboardAPI.getData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onSettled: (data, error) => {
      if (error) {
        toast({
          title: "Unable to load dashboard data",
          description: "Using mock data for preview",
          variant: "default",
        });
      }
    }
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Process chart data based on selected time period
  const salesData = dashboardData?.dailyRevenue || [];

  return (
    <div className="container px-2 sm:px-4 py-3 sm:py-6 mx-auto max-w-7xl animate-fade-in">
      {isLoading ? (
        <div className="flex justify-center items-center h-[70vh] flex-col">
          <Spinner size="lg" className="mb-4" />
          <h3 className="text-xl font-medium">Loading Dashboard...</h3>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Dashboard</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={refreshData}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <>
                  <Spinner size="sm" />
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </Button>
          </div>
        
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
            <SlideUpTransition show={true} duration={300}>
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">Today's Sales</h3>
                  <div className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-semibold">{formatCurrency(dashboardData?.todayRevenue || 0)}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  {dashboardData?.totalTransactions || 0} transactions
                </p>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={400}>
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">Products</h3>
                  <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-semibold">{dashboardData?.lowStockProducts?.length || 0}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Low stock items</p>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={500}>
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">Customers</h3>
                  <div className="p-1.5 sm:p-2 rounded-full bg-purple-100 text-purple-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-semibold">{dashboardData?.uniqueCustomers || 25}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Active today</p>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={600}>
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">Average Sale</h3>
                  <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 text-amber-600">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-semibold">{formatCurrency(dashboardData?.averageSale || 42000)}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Per transaction</p>
              </GlassCard>
            </SlideUpTransition>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            <SlideUpTransition show={true} duration={700} className="lg:col-span-2">
              <GlassCard className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                  <h3 className="font-medium">Sales Overview</h3>
                  <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
                    <Button 
                      variant={selected === "today" ? "secondary" : "ghost"} 
                      size={isMobile ? "xs" : "sm"}
                      onClick={() => setSelected("today")}
                      className="text-xs sm:text-sm"
                    >
                      Today
                    </Button>
                    <Button 
                      variant={selected === "week" ? "secondary" : "ghost"} 
                      size={isMobile ? "xs" : "sm"}
                      onClick={() => setSelected("week")}
                      className="text-xs sm:text-sm"
                    >
                      This Week
                    </Button>
                    <Button 
                      variant={selected === "month" ? "secondary" : "ghost"} 
                      size={isMobile ? "xs" : "sm"}
                      onClick={() => setSelected("month")}
                      className="text-xs sm:text-sm"
                    >
                      This Month
                    </Button>
                  </div>
                </div>
                
                <div className="h-[220px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 10, right: 5, left: -15, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${value / 1000}k`} 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Sales']}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(8px)',
                          background: 'rgba(255, 255, 255, 0.8)'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="rgba(59, 130, 246, 0.8)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={800}>
              <Card className="p-4 sm:p-6 h-full border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-medium mb-3 sm:mb-4">Quick Actions</h3>
                
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-2 sm:py-3"
                    onClick={() => navigate('/cashier')}
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3">
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">New Transaction</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Create a new sale</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-2 sm:py-3"
                    onClick={() => navigate('/products')}
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 rounded-full bg-indigo-100 text-indigo-600 mr-2 sm:mr-3">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Add Product</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Update inventory</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-2 sm:py-3"
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 rounded-full bg-orange-100 text-orange-600 mr-2 sm:mr-3">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">View Transactions</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Check sales history</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-2 sm:py-3"
                    onClick={() => navigate('/cashier')}
                  >
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600 mr-2 sm:mr-3">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Add Sale</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Record new sales</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </Card>
            </SlideUpTransition>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
