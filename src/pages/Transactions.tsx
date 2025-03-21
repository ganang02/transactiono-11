import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ChevronDown, 
  Eye, 
  Receipt,
  Clock,
  X,
  ArrowLeft,
  ShoppingCart,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { transactions, formatCurrency, formatDate } from "@/data/mockData";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { useQuery } from "@tanstack/react-query";
import { TransactionsAPI, StoreAPI } from "@/api/api";
import { toast } from "@/hooks/use-toast";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: TransactionsAPI.getAll,
  });
  
  const { data: storeInfo } = useQuery({
    queryKey: ['store'],
    queryFn: StoreAPI.getInfo,
  });
  
  const { 
    selectedDevice: connectedPrinter,
    printReceipt
  } = useBluetoothPrinter();

  // Listen for search events from the header
  useEffect(() => {
    const handleGlobalSearch = (event: CustomEvent) => {
      setSearch(event.detail);
    };

    window.addEventListener('app-search', handleGlobalSearch as EventListener);
    
    return () => {
      window.removeEventListener('app-search', handleGlobalSearch as EventListener);
    };
  }, []);

  // Add the missing handleSearch function
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredTransactions = transactionsData
    ? transactionsData.filter((transaction) =>
        transaction.id.toLowerCase().includes(search.toLowerCase()) ||
        transaction.items.some(item => 
          item.productName.toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  const transaction = transactionsData?.find(t => t.id === selectedTransaction);

  const handlePrintReceipt = async () => {
    if (!transaction || !storeInfo) return;
    
    if (!connectedPrinter) {
      setShowPrinterModal(true);
      return;
    }
    
    const receiptData = {
      storeName: storeInfo.name,
      storeAddress: storeInfo.address,
      storeWhatsapp: storeInfo.whatsapp,
      transactionId: transaction.id,
      date: formatDate(transaction.date),
      items: transaction.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      subtotal: transaction.total * 0.9,
      tax: transaction.total * 0.1,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      notes: storeInfo.notes
    };
    
    try {
      await printReceipt(receiptData);
    } catch (error) {
      toast({
        title: "Printing failed",
        description: "Could not print receipt. Please check printer connection.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in">
      {selectedTransaction ? (
        <div className="mt-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setSelectedTransaction(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
          
          {transaction && (
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Transaction #{transaction.id}</h2>
                    <p className="text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    {transaction.receipt && (
                      <Button 
                        className="gap-2"
                        onClick={handlePrintReceipt}
                      >
                        <Printer className="h-4 w-4" />
                        Print Receipt
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1 flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          transaction.status === 'completed' ? 'bg-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="capitalize">{transaction.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="mt-1 capitalize">{transaction.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt</p>
                      <p className="mt-1">{transaction.receipt ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Product</th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-muted-foreground">Price</th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-3 px-4">{item.productName}</td>
                          <td className="py-3 px-4 text-center">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(transaction.total * 0.9)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>{formatCurrency(transaction.total * 0.1)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium text-lg border-t mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(transaction.total)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-6 mt-6">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={handleSearch}
                className="pl-9 w-full bg-background/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Transaction ID</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Date & Time</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Status</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Payment</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">Total</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, index) => (
                      <SlideUpTransition key={transaction.id} show={true} duration={300 + index * 30}>
                        <tr className="border-b hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium">{transaction.id}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(transaction.date)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full mr-2 ${
                                transaction.status === 'completed' ? 'bg-green-500' :
                                transaction.status === 'pending' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`} />
                              <span className="capitalize">{transaction.status}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center capitalize">{transaction.paymentMethod}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(transaction.total)}</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setSelectedTransaction(transaction.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {transaction.receipt && (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </SlideUpTransition>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              </div>
            )}
          </GlassCard>
        </>
      )}
      
      <BluetoothPrinterModal 
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={() => setShowPrinterModal(false)}
        previewTransaction={transaction}
        previewStoreInfo={storeInfo}
      />
    </div>
  );
};

export default Transactions;
