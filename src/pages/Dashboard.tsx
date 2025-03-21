
import React, { useState } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Calendar, 
  ArrowRight,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { transactions, expenses, products, formatCurrency } from "@/data/mockData";
import { SlideUpTransition } from "@/hooks/useTransition";

const salesData = [
  { name: 'Mon', sales: 850000 },
  { name: 'Tue', sales: 750000 },
  { name: 'Wed', sales: 920000 },
  { name: 'Thu', sales: 1050000 },
  { name: 'Fri', sales: 1200000 },
  { name: 'Sat', sales: 1350000 },
  { name: 'Sun', sales: 1000000 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("today");

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

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl animate-fade-in">
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
            <p className="text-muted-foreground text-sm mt-2">From {transactions.length} transactions</p>
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
    </div>
  );
};

export default Dashboard;
