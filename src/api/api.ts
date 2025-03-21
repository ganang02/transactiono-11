
import { toast } from "@/hooks/use-toast";

// Use the environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
        description: "Could not connect to the server. Please check your network connection and server URL.",
        variant: "destructive",
      });
    }
    
    // Mock data for development without backend
    if (endpoint === '/products' && options.method === undefined) {
      console.log('Returning mock products data');
      return [
        { id: '1', name: 'Coffee', price: 15000, stock: 100, category: 'drinks', barcode: '8991234567891' },
        { id: '2', name: 'Tea', price: 12000, stock: 75, category: 'drinks', barcode: '8991234567892' },
        { id: '3', name: 'Sandwich', price: 25000, stock: 20, category: 'food', barcode: '8991234567893' },
        { id: '4', name: 'Cake', price: 18000, stock: 15, category: 'dessert', barcode: '8991234567894' },
        { id: '5', name: 'Cookies', price: 10000, stock: 5, category: 'dessert', barcode: '8991234567895' },
      ];
    }
    
    if (endpoint === '/dashboard') {
      console.log('Returning mock dashboard data');
      return {
        salesSummary: {
          total: 1250000,
          count: 25,
          average: 50000
        },
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
  
  create: (transaction) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
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
export function formatCurrency(amount: number): string {
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
