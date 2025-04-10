import { toast } from "@/hooks/use-toast";

// Use the environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://apiplastik.gannuniverse.online/api';

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    // For non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || 'An error occurred',
          variant: "destructive",
        });
        throw new Error(data.error || 'An error occurred');
      }
      
      return data;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: text || 'An error occurred',
          variant: "destructive",
        });
        throw new Error(text || 'An error occurred');
      }
      
      return { success: true, text };
    }
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    // Show specific network errors for mobile debugging
    if (error instanceof TypeError && error.message.includes('Network')) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Using offline data.",
        variant: "default",
      });
    }
    
    // Mock data for development without backend
    if (endpoint === '/dashboard') {
      console.log('Returning mock dashboard data');
      return {
        todayRevenue: 1250000,
        totalTransactions: 25,
        uniqueCustomers: 18,
        averageSale: 50000,
        lowStockProducts: [
          { id: '5', name: 'Cookies', stock: 5 },
          { id: '4', name: 'Cake', stock: 15 }
        ],
        dailyRevenue: [
          { date: 'Mon', revenue: 450000 },
          { date: 'Tue', revenue: 650000 },
          { date: 'Wed', revenue: 850000 },
          { date: 'Thu', revenue: 950000 },
          { date: 'Fri', revenue: 750000 },
          { date: 'Sat', revenue: 1250000 },
          { date: 'Sun', revenue: 980000 }
        ],
        recentTransactions: [
          { id: 'T001', date: new Date().toISOString(), total: 85000, items: 3 },
          { id: 'T002', date: new Date().toISOString(), total: 120000, items: 5 },
        ],
        topProducts: [
          { name: 'Coffee', sold: 45, revenue: 675000 },
          { name: 'Sandwich', sold: 18, revenue: 450000 },
        ]
      };
    }
    
    if (endpoint === '/products' && options.method === undefined) {
      console.log('Returning mock products data');
      return [
        { id: '1', name: 'Coffee', price: 15000, stock: 100, category: 'drinks', barcode: '8991234567891', imageUrl: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300' },
        { id: '2', name: 'Tea', price: 12000, stock: 75, category: 'drinks', barcode: '8991234567892', imageUrl: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300' },
        { id: '3', name: 'Sandwich', price: 25000, stock: 20, category: 'food', barcode: '8991234567893', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300' },
        { id: '4', name: 'Cake', price: 18000, stock: 15, category: 'dessert', barcode: '8991234567894', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300' },
        { id: '5', name: 'Cookies', price: 10000, stock: 5, category: 'dessert', barcode: '8991234567895', imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300' },
      ];
    }
    
    if (endpoint === '/transactions/pending') {
      console.log('Returning mock pending transactions data');
      return [
        { 
          id: 'P001', 
          date: new Date().toISOString(), 
          items: [
            { productId: '1', productName: 'Coffee', quantity: 2, price: 15000, subtotal: 30000 },
            { productId: '3', productName: 'Sandwich', quantity: 1, price: 25000, subtotal: 25000 }
          ],
          subtotal: 55000,
          tax: 0,
          total: 55000,
          paymentMethod: null,
          paymentStatus: 'pending',
          status: 'pending'
        },
        { 
          id: 'P002', 
          date: new Date(Date.now() - 86400000).toISOString(), 
          items: [
            { productId: '2', productName: 'Tea', quantity: 1, price: 12000, subtotal: 12000 },
            { productId: '4', productName: 'Cake', quantity: 1, price: 18000, subtotal: 18000 }
          ],
          subtotal: 30000,
          tax: 0,
          total: 30000,
          paymentMethod: null,
          paymentStatus: 'pending',
          status: 'pending'
        }
      ];
    }
    
    throw error;
  }
}

// Products API
export const ProductsAPI = {
  getAll: () => apiRequest('/products'),
  
  create: (product) => apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  
  update: (id, product) => apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  
  delete: (id) => apiRequest(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Transactions API
export const TransactionsAPI = {
  getAll: () => apiRequest('/transactions'),
  
  getPending: () => apiRequest('/transactions/pending'),
  
  create: (transaction) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  
  updateStatus: (id, updateData) => apiRequest(`/transactions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  }),
};

// Store Info API
export const StoreAPI = {
  getInfo: () => apiRequest('/store'),
  
  updateInfo: (storeInfo) => apiRequest('/store', {
    method: 'PUT',
    body: JSON.stringify(storeInfo),
  }),
};

// Dashboard API
export const DashboardAPI = {
  getData: () => apiRequest('/dashboard'),
  
  getSalesReport: (startDate, endDate) => apiRequest(`/dashboard/sales?start=${startDate}&end=${endDate}`),
  
  getMonthlySalesReport: (year, month) => apiRequest(`/dashboard/monthly-sales?year=${year}&month=${month}`),
};

// Expenses API
export const ExpensesAPI = {
  getAll: () => apiRequest('/expenses'),
  
  create: (expense) => apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  }),
};

// Helper functions
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(0);
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Tambahkan fungsi untuk ekspor data ke CSV
export function exportToCSV(data: any[], headers: string[], filename: string) {
  if (!data || data.length === 0) {
    return false;
  }

  // Add headers
  let csvContent = headers.join(",") + "\n";
  
  // Add data rows
  data.forEach(row => {
    const csvRow = row.map((cell: any) => {
      // Check if cell contains commas or quotes, wrap in quotes if needed
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csvContent += csvRow.join(",") + "\n";
  });
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
}
