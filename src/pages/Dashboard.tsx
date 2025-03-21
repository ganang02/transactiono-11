
import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Calendar, 
  ArrowRight,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { transactions as initialTransactions, expenses as initialExpenses, products as initialProducts, formatCurrency } from "@/data/mockData";
import { SlideUpTransition } from "@/hooks/useTransition";
import { Spinner } from "@/components/ui/spinner";

// Local Storage Keys
const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'pos-app-products',
  TRANSACTIONS: 'pos-app-transactions',
  EXPENSES: 'pos-app-expenses'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("today");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for data
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load transactions from localStorage or use initial data
      const savedTransactions = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
      const transactionsData = savedTransactions ? JSON.parse(savedTransactions) : initialTransactions;
      setTransactions(transactionsData);
      
      // Save to localStorage if not already there
      if (!savedTransactions) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
      }
      
      // Load expenses
      const savedExpenses = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
      const expensesData = savedExpenses ? JSON.parse(savedExpenses) : initialExpenses;
      setExpenses(expensesData);
      
      if (!savedExpenses) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
      }
      
      // Load products
      const savedProducts = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      const productsData = savedProducts ? JSON.parse(savedProducts) : initialProducts;
      setProducts(productsData);
      
      if (!savedProducts) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      }
      
      // Generate sales data
      generateSalesData(transactionsData, selected);
      
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const refreshData = () => {
    setIsRefreshing(true);
    loadData();
  };
  
  // Generate sales data based on time period
  const generateSalesData = (transactionsData, period) => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let filteredTransactions = [];
    let data = [];
    
    if (period === 'today') {
      // Today's sales by hour
      const todayDate = today.toISOString().split('T')[0];
      
      // Create hours array (0-23)
      const hours = Array.from({ length: 24 }, (_, i) => i);
      
      // Filter transactions for today
      filteredTransactions = transactionsData.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        return transactionDate === todayDate && transaction.status === 'completed';
      });
      
      // Group by hour
      data = hours.map(hour => {
        const hourSales = filteredTransactions.filter(transaction => {
          const transactionHour = new Date(transaction.date).getHours();
          return transactionHour === hour;
        });
        
        const sales = hourSales.reduce((sum, transaction) => sum + transaction.total, 0);
        
        return {
          name: `${hour}:00`,
          sales: sales
        };
      });
      
    } else if (period === 'week') {
      // This week's sales by day
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
      
      // Create days array (0-6, Sunday-Saturday)
      const days = Array.from({ length: 7 }, (_, i) => i);
      
      data = days.map(day => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const daySales = transactionsData.filter(transaction => {
          const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
          return transactionDate === dateString && transaction.status === 'completed';
        });
        
        const sales = daySales.reduce((sum, transaction) => sum + transaction.total, 0);
        
        return {
          name: dayNames[day],
          sales: sales
        };
      });
      
    } else if (period === 'month') {
      // This month's sales by week
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Create weeks array (1-5)
      const weeks = Array.from({ length: 5 }, (_, i) => i + 1);
      
      data = weeks.map(week => {
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const startOfWeek = new Date(startOfMonth);
        startOfWeek.setDate((week - 1) * 7 + 1);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const weekSales = transactionsData.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate >= startOfWeek && 
            transactionDate <= endOfWeek &&
            transaction.status === 'completed'
          );
        });
        
        const sales = weekSales.reduce((sum, transaction) => sum + transaction.total, 0);
        
        return {
          name: `Week ${week}`,
          sales: sales
        };
      });
    }
    
    setSalesData(data);
  };
  
  useEffect(() => {
    generateSalesData(transactions, selected);
  }, [selected, transactions]);

  // Calculate today's sales
  const todaySales = transactions.reduce((total, transaction) => {
    const today = new Date().toISOString().split('T')[0];
    const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
    
    if (transactionDate === today && transaction.status === 'completed') {
      return total + transaction.total;
    }
    
    return total;
  }, 0);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((total, expense) => {
    return total + expense.amount;
  }, 0);
  
  // Count today's transactions
  const todayTransactionsCount = transactions.filter(transaction => {
    const today = new Date().toISOString().split('T')[0];
    const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
    return transactionDate === today && transaction.status === 'completed';
  }).length;

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl animate-fade-in">
      {isLoading ? (
        <div className="flex justify-center items-center h-[70vh] flex-col">
          <Spinner size="lg" className="mb-4" />
          <h3 className="text-xl font-medium">Loading Dashboard...</h3>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Spinner size="sm" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SlideUpTransition show={true} duration={300}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground text-sm font-medium">Today's Sales</h3>
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-semibold">{formatCurrency(todaySales)}</p>
                <p className="text-muted-foreground text-sm mt-2">From {todayTransactionsCount} transactions</p>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={400}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground text-sm font-medium">Total Expenses</h3>
                  <div className="p-2 rounded-full bg-red-100 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-semibold">{formatCurrency(totalExpenses)}</p>
                <p className="text-muted-foreground text-sm mt-2">From {expenses.length} expenses</p>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={500}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground text-sm font-medium">Products</h3>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-3xl font-semibold">{products.length}</p>
                <p className="text-muted-foreground text-sm mt-2">In inventory</p>
              </GlassCard>
            </SlideUpTransition>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SlideUpTransition show={true} duration={600} className="lg:col-span-2">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium">Sales Overview</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={selected === "today" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setSelected("today")}
                    >
                      Today
                    </Button>
                    <Button 
                      variant={selected === "week" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setSelected("week")}
                    >
                      This Week
                    </Button>
                    <Button 
                      variant={selected === "month" ? "secondary" : "ghost"} 
                      size="sm"
                      onClick={() => setSelected("month")}
                    >
                      This Month
                    </Button>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${value / 1000}k`} 
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
                        dataKey="sales" 
                        fill="rgba(59, 130, 246, 0.8)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </SlideUpTransition>

            <SlideUpTransition show={true} duration={700}>
              <GlassCard className="p-6">
                <h3 className="font-medium mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-3"
                    onClick={() => navigate('/cashier')}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">New Transaction</p>
                        <p className="text-xs text-muted-foreground">Create a new sale</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-3"
                    onClick={() => navigate('/products')}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Add Product</p>
                        <p className="text-xs text-muted-foreground">Update inventory</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-3"
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-orange-100 text-orange-600 mr-3">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">View Transactions</p>
                        <p className="text-xs text-muted-foreground">Check sales history</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between group text-left h-auto py-3"
                    onClick={() => navigate('/')}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Add Expense</p>
                        <p className="text-xs text-muted-foreground">Record expenditure</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </GlassCard>
            </SlideUpTransition>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
