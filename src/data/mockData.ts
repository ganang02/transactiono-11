
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'other';
  status: 'completed' | 'pending' | 'cancelled';
  receipt: boolean;
  amountPaid?: number;
  change?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface StoreInfo {
  name: string;
  whatsapp: string;
  address: string;
  notes: string;
  logo?: string;
}

// Initial data to use if none exists in local storage
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Coffee Cup',
    price: 25000,
    stock: 50,
    category: 'Drinks',
  },
  {
    id: '2',
    name: 'Sandwich',
    price: 35000,
    stock: 20,
    category: 'Food',
  },
  {
    id: '3',
    name: 'French Fries',
    price: 20000,
    stock: 40,
    category: 'Food',
  },
  {
    id: '4',
    name: 'Iced Tea',
    price: 15000,
    stock: 60,
    category: 'Drinks',
  },
  {
    id: '5',
    name: 'Chocolate Cake',
    price: 40000,
    stock: 15,
    category: 'Dessert',
  },
];

const initialTransactions: Transaction[] = [
  {
    id: 'T001',
    date: '2023-08-15T10:30:00',
    items: [
      {
        id: 'TI001',
        productId: '1',
        productName: 'Coffee Cup',
        quantity: 2,
        price: 25000,
        subtotal: 50000
      },
      {
        id: 'TI002',
        productId: '2',
        productName: 'Sandwich',
        quantity: 1,
        price: 35000,
        subtotal: 35000
      }
    ],
    total: 85000,
    paymentMethod: 'cash',
    status: 'completed',
    receipt: true
  },
  {
    id: 'T002',
    date: '2023-08-15T14:15:00',
    items: [
      {
        id: 'TI003',
        productId: '3',
        productName: 'French Fries',
        quantity: 2,
        price: 20000,
        subtotal: 40000
      },
      {
        id: 'TI004',
        productId: '4',
        productName: 'Iced Tea',
        quantity: 2,
        price: 15000,
        subtotal: 30000
      }
    ],
    total: 70000,
    paymentMethod: 'card',
    status: 'completed',
    receipt: true
  },
  {
    id: 'T003',
    date: '2023-08-16T09:45:00',
    items: [
      {
        id: 'TI005',
        productId: '5',
        productName: 'Chocolate Cake',
        quantity: 1,
        price: 40000,
        subtotal: 40000
      },
      {
        id: 'TI006',
        productId: '1',
        productName: 'Coffee Cup',
        quantity: 1,
        price: 25000,
        subtotal: 25000
      }
    ],
    total: 65000,
    paymentMethod: 'cash',
    status: 'completed',
    receipt: false
  }
];

const initialExpenses: Expense[] = [
  {
    id: 'E001',
    date: '2023-08-14T08:00:00',
    amount: 500000,
    category: 'Inventory',
    description: 'Coffee beans stock'
  },
  {
    id: 'E002',
    date: '2023-08-15T16:30:00',
    amount: 200000,
    category: 'Utilities',
    description: 'Electricity bill'
  },
  {
    id: 'E003',
    date: '2023-08-16T10:15:00',
    amount: 150000,
    category: 'Maintenance',
    description: 'Coffee machine repair'
  }
];

const initialStoreInfo: StoreInfo = {
  name: 'Coffee Corner',
  whatsapp: '+6281234567890',
  address: 'Jl. Sudirman No. 123, Jakarta',
  notes: 'Open daily from 8 AM to 10 PM',
};

// Local Storage Keys
const STORAGE_KEYS = {
  PRODUCTS: 'pos-app-products',
  TRANSACTIONS: 'pos-app-transactions',
  EXPENSES: 'pos-app-expenses',
  STORE_INFO: 'pos-app-store-info'
};

// For backwards compatibility, still export the initial mock data
export const products = initialProducts;
export const transactions = initialTransactions;
export const expenses = initialExpenses;
export const storeInfo = initialStoreInfo;

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

// Dashboard summary data - this is now replaced by API calls
export function getDashboardData() {
  // Create an interface for the product sales object
  interface ProductSale {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }

  // For type safety with the productSales object
  const productSales: Record<string, ProductSale> = {};
  
  // Filter today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate today's revenue
  const todayRevenue = transactions.reduce((sum, transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transaction.status === 'completed' && transactionDate >= today) {
      return sum + transaction.total;
    }
    return sum;
  }, 0);
  
  // Low stock products
  const lowStockProducts = products.filter(product => product.stock < 10);
  
  // Best selling products - making sure we access productSales correctly
  transactions.forEach(transaction => {
    transaction.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { 
          id: item.productId, 
          name: item.productName, 
          quantity: 0,
          revenue: 0
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.subtotal;
    });
  });
  
  // This handles the type safety correctly
  const bestSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  
  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  // Transaction stats for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();
  
  const dailyRevenue = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const revenue = transactions.reduce((sum, transaction) => {
      const transactionDate = new Date(transaction.date);
      if (
        transaction.status === 'completed' && 
        transactionDate >= date && 
        transactionDate < nextDay
      ) {
        return sum + transaction.total;
      }
      return sum;
    }, 0);
    
    return {
      date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      revenue
    };
  });
  
  return {
    totalRevenue: 0, // Removed as requested
    todayRevenue,
    totalTransactions: transactions.length,
    lowStockProducts,
    bestSellingProducts,
    recentTransactions,
    dailyRevenue
  };
}
