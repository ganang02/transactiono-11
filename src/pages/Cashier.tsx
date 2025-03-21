
import React, { useState, useEffect } from "react";
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
  Bluetooth
} from "lucide-react";
import GlassCard from "@/components/ui-custom/GlassCard";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { 
  getProducts, 
  addTransaction, 
  getStoreInfo, 
  formatCurrency,
  saveProducts
} from "@/data/mockData";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Define interface for transaction data
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
  paymentMethod: 'cash' | 'card';
  status: string;
  receipt: boolean;
  amountPaid?: number;
  change?: number;
}

// Real data functions for products
const fetchProducts = async () => {
  // Simulate some network delay for better UX
  await new Promise(resolve => setTimeout(resolve, 300));
  return getProducts();
};

// Real function to create a transaction
const createTransaction = async (transactionData: TransactionData) => {
  // Generate a unique transaction ID
  const newTransactionId = `T${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  // Create the complete transaction object
  const newTransaction = { 
    id: newTransactionId,
    date: new Date().toISOString(),
    ...transactionData
  };
  
  // Add to storage
  const savedTransaction = addTransaction(newTransaction);
  
  // Update product stock
  const products = getProducts();
  const updatedProducts = products.map(product => {
    const transactionItem = transactionData.items.find(item => item.productId === product.id);
    if (transactionItem) {
      return {
        ...product,
        stock: product.stock - transactionItem.quantity
      };
    }
    return product;
  });
  
  // Save updated product stock
  saveProducts(updatedProducts);
  
  return savedTransaction;
};

const Cashier = () => {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  
  const { 
    selectedDevice: connectedPrinter,
    printReceipt: printToBluetoothPrinter,
    isPrinting
  } = useBluetoothPrinter();

  // Fetch products data
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (data) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "Transaction completed",
        description: `Transaction #${data.id} successfully recorded`,
      });
      
      // Print receipt if needed
      if (printReceipt) {
        handlePrintReceipt(data);
      }
      
      // Reset state
      setCart([]);
      setShowPayment(false);
      setPaymentAmount("");
    },
    onError: (error) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredProducts = productsData 
    ? productsData.filter((product) => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode.includes(search)
      )
    : [];

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  
  const change = paymentAmount ? parseInt(paymentAmount.replace(/[^0-9]/g, "")) - total : 0;

  const addToCart = (product) => {
    // Check if we have enough stock
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
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Check stock before adding more
        const currentQtyInCart = existingItem.quantity;
        if (currentQtyInCart + 1 > product.stock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${product.stock} ${product.name} available in stock`,
            variant: "destructive",
            duration: 2000,
          });
          return prevCart;
        }
        
        return prevCart.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
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
    
    // Check if we have enough stock
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

  const handlePayment = (method: 'cash' | 'card') => {
    if (method === 'cash' && (isNaN(parseInt(paymentAmount.replace(/[^0-9]/g, ""))) || parseInt(paymentAmount.replace(/[^0-9]/g, "")) < total)) {
      toast({
        title: "Invalid payment",
        description: "Payment amount must be greater than or equal to total",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare transaction data
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
      paymentMethod: method,
      status: 'completed',
      receipt: printReceipt
    };
    
    // Add cash-specific details
    if (method === 'cash') {
      transactionData.amountPaid = parseInt(paymentAmount.replace(/[^0-9]/g, ""));
      transactionData.change = change;
    }
    
    // Process transaction
    createTransactionMutation.mutate(transactionData);
  };

  const handlePrintReceipt = async (transactionData: TransactionData) => {
    if (!connectedPrinter) {
      toast({
        title: "Printer not connected",
        description: "Please connect to a printer first",
        variant: "destructive",
      });
      setShowPrinterModal(true);
      return;
    }
    
    const storeInfo = getStoreInfo();
    
    const receiptData = {
      storeName: storeInfo.name,
      storeAddress: storeInfo.address,
      storeWhatsapp: storeInfo.whatsapp,
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
      notes: storeInfo.notes
    };
    
    await printToBluetoothPrinter(receiptData);
  };

  // Function to handle barcode scanning
  const handleBarcodeScan = () => {
    if ('BarcodeDetector' in window) {
      // The Web Barcode Detection API is available
      toast({
        title: "Scanning",
        description: "Please position barcode in front of camera",
      });
      
      // In a real implementation, this would activate the camera
      // and scan for barcodes using the Barcode Detection API
      
      // For now, we'll just show an example
      setTimeout(() => {
        setSearch("8991234567891"); // This would be the scanned barcode
      }, 2000);
    } else {
      toast({
        title: "Barcode scanning not supported",
        description: "Your browser doesn't support barcode scanning",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left side - Product selection */}
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

        {/* Right side - Cart */}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>{formatCurrency(tax)}</span>
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
          
          {/* Printer connection status */}
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

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUpTransition show={true}>
            <GlassCard className="w-full max-w-md rounded-xl overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-medium">Payment</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPayment(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
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
                        <span className={`font-medium ${change < 0 ? 'text-destructive' : ''}`}>
                          {formatCurrency(change)}
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
                    onClick={() => handlePayment('cash')}
                    disabled={createTransactionMutation.isPending || (printReceipt && !connectedPrinter)}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Cash
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => handlePayment('card')}
                    disabled={createTransactionMutation.isPending || (printReceipt && !connectedPrinter)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card
                  </Button>
                </div>
                
                {printReceipt && !connectedPrinter && (
                  <p className="text-xs text-amber-500 mt-2 text-center">
                    Please connect to a printer first or disable receipt printing
                  </p>
                )}
                
                {createTransactionMutation.isPending && (
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
      
      {/* Bluetooth Printer Modal */}
      <BluetoothPrinterModal 
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={() => setShowPrinterModal(false)}
      />
    </div>
  );
};

// Helper to get color based on product category
function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
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
