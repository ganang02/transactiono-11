
import { toast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
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
