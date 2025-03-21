
export interface Product {
  id: string;
  name: string;
  barcode: string;
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

// Mock product data
export const products: Product[] = [
  {
    id: '1',
    name: 'Coffee Cup',
    barcode: '8991234567890',
    price: 25000,
    stock: 50,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29mZmVlJTIwY3VwfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '2',
    name: 'Sandwich',
    barcode: '8991234567891',
    price: 35000,
    stock: 20,
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FuZHdpY2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '3',
    name: 'French Fries',
    barcode: '8991234567892',
    price: 20000,
    stock: 40,
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZnJlbmNoJTIwZnJpZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '4',
    name: 'Iced Tea',
    barcode: '8991234567893',
    price: 15000,
    stock: 60,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aWNlZCUyMHRlYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
  },
  {
    id: '5',
    name: 'Chocolate Cake',
    barcode: '8991234567894',
    price: 40000,
    stock: 15,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2hvY29sYXRlJTIwY2FrZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
  },
];

// Mock transaction data
export const transactions: Transaction[] = [
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

// Mock expense data
export const expenses: Expense[] = [
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

// Mock store info
export const storeInfo: StoreInfo = {
  name: 'Coffee Corner',
  whatsapp: '+6281234567890',
  address: 'Jl. Sudirman No. 123, Jakarta',
  notes: 'Open daily from 8 AM to 10 PM',
  logo: 'https://images.unsplash.com/photo-1518226203301-8e7f833c6a94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y29mZmVlJTIwbG9nb3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
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
