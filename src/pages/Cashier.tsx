
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Printer, 
  CreditCard,
  Search,
  Barcode,
  ShoppingCart,
  X,
  Package,
  Bluetooth,
  Clock,
  Check,
  AlertCircle
} from "lucide-react";
import GlassCard from "@/components/ui-custom/GlassCard";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { formatCurrency } from "@/api/api";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { ProductsAPI, TransactionsAPI, StoreAPI } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TransactionData {
  id?: string;
  date?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | null;
  paymentStatus: 'pending' | 'completed';
  status: string;
  receipt: boolean;
  amountPaid?: number;
  change?: number;
}

interface StoreInfo {
  name: string;
  address: string;
  whatsapp: string;
  notes?: string;
}

const Cashier = () => {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("new");
  
  const { 
    selectedDevice: connectedPrinter,
    printReceipt: printToBluetoothPrinter,
    isPrinting
  } = useBluetoothPrinter();

  const { 
    data: productsData = [], 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: ProductsAPI.getAll,
  });

  const { data: storeInfo } = useQuery<StoreInfo>({
    queryKey: ['store'],
    queryFn: StoreAPI.getInfo,
  });

  // Fetch pending transactions
  const {
    data: pendingTransactions = [],
    isLoading: isLoadingPending,
    error: pendingError
  } = useQuery<TransactionData[]>({
    queryKey: ['transactions', 'pending'],
    queryFn: TransactionsAPI.getPending,
    enabled: activeTab === "pending"
  });

  const createTransactionMutation = useMutation({
    mutationFn: (transactionData: TransactionData) => TransactionsAPI.create(transactionData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: data.paymentStatus === 'completed' ? "Transaction completed" : "Transaction saved as pending",
        description: `Transaction #${data.id} successfully ${data.paymentStatus === 'completed' ? 'recorded' : 'saved as pending'}`,
      });
      
      if (data.paymentStatus === 'completed' && printReceipt) {
        handlePrintReceipt(data);
      }
      
      setCart([]);
      setShowPayment(false);
      setPaymentAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    }
  });

  const completeTransactionMutation = useMutation({
    mutationFn: (data: {id: string, paymentMethod: 'cash' | 'card', amountPaid?: number, change?: number}) => 
      TransactionsAPI.updateStatus(data.id, {
        paymentStatus: 'completed',
        paymentMethod: data.paymentMethod,
        amountPaid: data.amountPaid,
        change: data.change
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "Payment completed",
        description: `Transaction #${data.id} payment has been processed`,
      });
      
      if (printReceipt) {
        handlePrintReceipt(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment processing failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Compute filtered products from search term
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return productsData;
    
    return productsData.filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      (product.barcode && product.barcode.includes(searchTerm))
    );
  }, [productsData, search]);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  // Removed tax calculation as requested
  const tax = 0;
  const total = subtotal + tax;
  
  const change = paymentAmount ? parseInt(paymentAmount.replace(/[^0-9]/g, "")) - total : 0;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is out of stock`,
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id.toString());
      
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${product.stock} ${product.name} available in stock`,
            variant: "destructive",
            duration: 2000,
          });
          return prevCart;
        }
        
        return prevCart.map((item) => 
          item.id === product.id.toString() ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { 
          id: product.id.toString(), 
          name: product.name, 
          price: product.price, 
          quantity: 1 
        }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
      duration: 2000,
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    if (productsData) {
      const product = productsData.find(p => p.id === id);
      if (product && quantity > product.stock) {
        toast({
          title: "Stock limit reached",
          description: `Only ${product.stock} ${product.name} available in stock`,
          variant: "destructive",
          duration: 2000,
        });
        return;
      }
    }
    
    setCart((prevCart) => 
      prevCart.map((item) => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to the cart first",
        variant: "destructive",
      });
      return;
    }
    
    setShowPayment(true);
  };

  const handlePayment = (method: 'cash' | 'card', payNow: boolean = true) => {
    if (payNow && method === 'cash' && (isNaN(parseInt(paymentAmount.replace(/[^0-9]/g, ""))) || parseInt(paymentAmount.replace(/[^0-9]/g, "")) < total)) {
      toast({
        title: "Invalid payment",
        description: "Payment amount must be greater than or equal to total",
        variant: "destructive",
      });
      return;
    }
    
    const transactionData: TransactionData = {
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal,
      tax,
      total,
      paymentMethod: payNow ? method : null,
      paymentStatus: payNow ? 'completed' : 'pending',
      status: payNow ? 'completed' : 'pending',
      receipt: printReceipt
    };
    
    if (payNow && method === 'cash') {
      transactionData.amountPaid = parseInt(paymentAmount.replace(/[^0-9]/g, ""));
      transactionData.change = change;
    }
    
    createTransactionMutation.mutate(transactionData);
  };

  const handleProcessPayment = (transaction: TransactionData, method: 'cash' | 'card') => {
    if (method === 'cash' && (isNaN(parseInt(paymentAmount.replace(/[^0-9]/g, ""))) || parseInt(paymentAmount.replace(/[^0-9]/g, "")) < transaction.total)) {
      toast({
        title: "Invalid payment",
        description: "Payment amount must be greater than or equal to total",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      id: transaction.id!,
      paymentMethod: method,
    };

    if (method === 'cash') {
      const amountPaid = parseInt(paymentAmount.replace(/[^0-9]/g, ""));
      const change = amountPaid - transaction.total;
      
      Object.assign(paymentData, {
        amountPaid,
        change
      });
    }

    completeTransactionMutation.mutate(paymentData as any);
    setShowPayment(false);
    setPaymentAmount("");
  };

  const handlePrintReceipt = async (transactionData: TransactionData) => {
    if (!connectedPrinter) {
      toast({
        title: "Printer not connected",
        description: "Please connect to a printer first",
        variant: "destructive",
      });
      setCurrentTransaction(transactionData);
      setShowPrinterModal(true);
      return;
    }
    
    if (!storeInfo) {
      toast({
        title: "Store information missing",
        description: "Please update store information in settings",
        variant: "destructive",
      });
      return;
    }
    
    const receiptData = {
      storeName: storeInfo?.name || '',
      storeAddress: storeInfo?.address || '',
      storeWhatsapp: storeInfo?.whatsapp || '',
      transactionId: transactionData.id || "",
      date: new Date().toLocaleString('id-ID'),
      items: transactionData.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      subtotal: transactionData.subtotal,
      tax: transactionData.tax,
      total: transactionData.total,
      paymentMethod: transactionData.paymentMethod === 'cash' ? 'Cash' : 'Card',
      amountPaid: transactionData.amountPaid,
      change: transactionData.change,
      notes: storeInfo?.notes || ''
    };
    
    try {
      await printToBluetoothPrinter(receiptData);
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Printing failed",
        description: "Could not print receipt. Please check printer connection.",
        variant: "destructive",
      });
    }
  };

  const handleBarcodeScan = () => {
    if ('BarcodeDetector' in window) {
      toast({
        title: "Scanning",
        description: "Please position barcode in front of camera",
      });
      
      setTimeout(() => {
        setSearch("8991234567891");
      }, 2000);
    } else {
      toast({
        title: "Barcode scanning not supported",
        description: "Your browser doesn't support barcode scanning",
        variant: "destructive",
      });
    }
  };

  // Load pending transaction into cart
  const loadPendingTransaction = (transaction: TransactionData) => {
    // Clear current cart
    setCart([]);
    
    // Convert transaction items to cart items
    const cartItems: CartItem[] = transaction.items.map(item => ({
      id: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    }));
    
    setCart(cartItems);
    setCurrentTransaction(transaction);
    
    toast({
      title: "Transaction loaded",
      description: `Transaction #${transaction.id} loaded into cart`,
    });
    
    // Switch to new transaction tab
    setActiveTab("new");
  };

  // Sync with Header search if any
  useEffect(() => {
    const handleAppSearch = (e: CustomEvent) => {
      setSearch(e.detail || "");
    };
    
    window.addEventListener('app-search' as any, handleAppSearch as EventListener);
    
    return () => {
      window.removeEventListener('app-search' as any, handleAppSearch as EventListener);
    };
  }, []);

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full flex justify-center mb-6">
          <TabsTrigger value="new" className="flex-1 max-w-32">
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 max-w-32">
            <Clock className="h-4 w-4 mr-2" />
            Pending Payment
            {pendingTransactions?.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search product or scan barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 100)}
                    className="pl-9 w-full bg-background/50 backdrop-blur-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleBarcodeScan}
                >
                  <Barcode className="h-4 w-4" />
                  Scan
                </Button>
              </div>

              <GlassCard className="p-4">
                {isLoadingProducts ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Spinner className="h-8 w-8 mb-4" />
                    <p className="font-medium">Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <X className="h-8 w-8 text-destructive mb-2" />
                    <h3 className="font-medium">Failed to load products</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please check your connection and try again
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <SlideUpTransition key={product.id} show={true}>
                          <div
                            className={`cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                              product.stock <= 0 ? 'opacity-50' : ''
                            }`}
                            onClick={() => addToCart(product)}
                          >
                            <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                              <div className={`bg-${getCategoryColor(product.category)}-100 w-full h-full flex items-center justify-center`}>
                                <Package className={`h-12 w-12 text-${getCategoryColor(product.category)}-500`} />
                              </div>
                              
                              {product.stock <= 5 && product.stock > 0 && (
                                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                                  Low Stock: {product.stock}
                                </div>
                              )}
                              
                              {product.stock <= 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                  <p className="text-white font-bold">OUT OF STOCK</p>
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <h3 className="text-sm font-medium truncate">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-sm font-semibold text-primary">
                                  {formatCurrency(product.price)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Stock: {product.stock}
                                </p>
                              </div>
                            </div>
                          </div>
                        </SlideUpTransition>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-medium">No products found</h3>
                        <p className="text-sm text-muted-foreground">
                          Try a different search term or scan a barcode
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="space-y-6">
              <GlassCard className="overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="font-medium">Cart</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                </div>

                {cart.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-auto p-4">
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center border-b pb-3">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium">{item.name}</h3>
                              <p className="text-sm text-primary">{formatCurrency(item.price)}</p>
                            </div>
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <span className="text-xl font-medium">-</span>
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <span className="text-xl font-medium">+</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive ml-1"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border-t bg-muted/30">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(total)}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleCheckout}
                        disabled={createTransactionMutation.isPending}
                      >
                        {createTransactionMutation.isPending ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          "Checkout"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="h-12 w-12 text-muted mb-4" />
                    <h3 className="font-medium">Your cart is empty</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add products to the cart to start a transaction
                    </p>
                  </div>
                )}
              </GlassCard>
              
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowPrinterModal(true)}
              >
                <Bluetooth className="h-4 w-4" />
                {connectedPrinter ? `Connected to ${connectedPrinter.name}` : "Connect to Printer"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-500" />
                Pending Payments
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Transactions waiting for payment
              </p>
            </div>

            <div className="divide-y">
              {isLoadingPending ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Spinner className="h-8 w-8 mb-4" />
                  <p className="font-medium">Loading pending transactions...</p>
                </div>
              ) : pendingError ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <h3 className="font-medium">Failed to load pending transactions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please check your connection and try again
                  </p>
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Check className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="font-medium">No pending transactions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All transactions have been paid
                  </p>
                </div>
              ) : (
                pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{`Transaction #${transaction.id}`}</h3>
                        <p className="text-sm text-muted-foreground">
                          {transaction.date ? new Date(transaction.date).toLocaleString('id-ID') : 'Date unknown'}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="text-sm flex justify-between">
                        <span>Items:</span>
                        <span>{transaction.items.length}</span>
                      </div>
                      <div className="text-sm flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(transaction.total)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setCurrentTransaction(transaction);
                          setShowPayment(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Process Payment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => loadPendingTransaction(transaction)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Load to Cart
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUpTransition show={true}>
            <GlassCard className="w-full max-w-md rounded-xl overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-medium">
                  {currentTransaction ? 'Process Payment' : 'Payment'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => {
                  setShowPayment(false);
                  setCurrentTransaction(null);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">
                      {formatCurrency(currentTransaction ? currentTransaction.total : total)}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Cash Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="text" 
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            if (value === "") {
                              setPaymentAmount("");
                            } else {
                              setPaymentAmount(formatCurrency(parseInt(value)));
                            }
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {paymentAmount && (
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Change</span>
                        <span className={`font-medium ${
                          currentTransaction 
                            ? (parseInt(paymentAmount.replace(/[^0-9]/g, "")) - currentTransaction.total) < 0 ? 'text-destructive' : ''
                            : change < 0 ? 'text-destructive' : ''
                        }`}>
                          {formatCurrency(
                            currentTransaction 
                              ? parseInt(paymentAmount.replace(/[^0-9]/g, "")) - currentTransaction.total
                              : change
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="print-receipt"
                        checked={printReceipt}
                        onChange={(e) => setPrintReceipt(e.target.checked)}
                        className="mr-1"
                      />
                      <label htmlFor="print-receipt" className="text-sm flex items-center gap-1">
                        <Printer className="h-3 w-3" />
                        Print receipt
                      </label>
                      
                      {printReceipt && !connectedPrinter && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto h-7 px-2 text-xs"
                          onClick={() => setShowPrinterModal(true)}
                        >
                          <Bluetooth className="h-3 w-3 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (currentTransaction) {
                        handleProcessPayment(currentTransaction, 'cash');
                      } else {
                        handlePayment('cash');
                      }
                    }}
                    disabled={createTransactionMutation.isPending || completeTransactionMutation.isPending || (printReceipt && !connectedPrinter)}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Cash
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (currentTransaction) {
                        handleProcessPayment(currentTransaction, 'card');
                      } else {
                        handlePayment('card');
                      }
                    }}
                    disabled={createTransactionMutation.isPending || completeTransactionMutation.isPending || (printReceipt && !connectedPrinter)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card
                  </Button>
                </div>
                
                {!currentTransaction && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => handlePayment('cash', false)}
                    disabled={createTransactionMutation.isPending}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Save for Later Payment
                  </Button>
                )}
                
                {printReceipt && !connectedPrinter && (
                  <p className="text-xs text-amber-500 mt-2 text-center">
                    Please connect to a printer first or disable receipt printing
                  </p>
                )}
                
                {(createTransactionMutation.isPending || completeTransactionMutation.isPending) && (
                  <div className="mt-4 flex justify-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    <span className="text-sm">Processing transaction...</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </SlideUpTransition>
        </div>
      )}
      
      <BluetoothPrinterModal 
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={() => setShowPrinterModal(false)}
        previewTransaction={currentTransaction}
        previewStoreInfo={storeInfo}
      />
    </div>
  );
};

function getCategoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'drinks':
      return 'blue';
    case 'food':
      return 'green';
    case 'dessert':
      return 'purple';
    default:
      return 'gray';
  }
}

export default Cashier;
