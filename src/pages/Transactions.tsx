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
  Printer,
  FileDown,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { formatCurrency, formatDate } from "@/api/api";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { useQuery } from "@tanstack/react-query";
import { TransactionsAPI, StoreAPI } from "@/api/api";
import { toast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui-custom/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "total" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
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

  useEffect(() => {
    const handleGlobalSearch = (event: CustomEvent) => {
      setSearch(event.detail);
    };

    window.addEventListener('app-search', handleGlobalSearch as EventListener);
    
    return () => {
      window.removeEventListener('app-search', handleGlobalSearch as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!transactionsData) return;
    
    let filtered = [...transactionsData];
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(
        transaction => 
          transaction.id.toLowerCase().includes(searchTerm) ||
          transaction.items.some((item: any) => 
            item.productName.toLowerCase().includes(searchTerm)
          )
      );
    }
    
    if (dateRange?.from) {
      filtered = filtered.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        if (dateRange.to) {
          return isWithinInterval(transactionDate, {
            start: dateRange.from,
            end: dateRange.to
          });
        }
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateRange.from);
        to.setHours(23, 59, 59, 999);
        return transactionDate >= from && transactionDate <= to;
      });
    }
    
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        transaction => transaction.status === statusFilter
      );
    }
    
    if (paymentMethodFilter && paymentMethodFilter !== "all") {
      filtered = filtered.filter(
        transaction => transaction.paymentMethod === paymentMethodFilter
      );
    }
    
    if (sortField && sortOrder) {
      filtered.sort((a, b) => {
        if (sortField === "date") {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          return sortOrder === "asc" 
            ? a.total - b.total 
            : b.total - a.total;
        }
      });
    }
    
    setFilteredTransactions(filtered);
  }, [transactionsData, search, dateRange, statusFilter, paymentMethodFilter, sortField, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSort = (field: "date" | "total") => {
    let order: "asc" | "desc" = "asc";
    
    if (sortField === field) {
      if (sortOrder === "asc") {
        order = "desc";
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
        return;
      }
    }
    
    setSortField(field);
    setSortOrder(order);
  };

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
      subtotal: transaction.total,
      tax: 0,
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

  const exportToCSV = () => {
    if (!filteredTransactions.length) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada transaksi untuk diekspor",
        variant: "destructive"
      });
      return;
    }
    
    const headers = ["ID", "Tanggal", "Status", "Metode Pembayaran", "Total"];
    
    const csvData = filteredTransactions.map(transaction => [
      transaction.id,
      formatDate(transaction.date),
      transaction.status,
      transaction.paymentMethod,
      transaction.total
    ]);
    
    let csvContent = headers.join(",") + "\n";
    
    csvData.forEach(row => {
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Kembali ke Transaksi
          </Button>
          
          {transaction && (
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Transaksi #{transaction.id}</h2>
                    <p className="text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={exportToCSV}
                    >
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
                      <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                      <p className="mt-1 capitalize">{transaction.paymentMethod || "Belum dibayar"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receipt</p>
                      <p className="mt-1">{transaction.receipt ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium mb-3">Daftar Barang</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Produk</th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-muted-foreground">Harga</th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-muted-foreground">Jumlah</th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/10">
                          <td className="py-3 px-4 font-medium">{item.productName}</td>
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
                      <span>{formatCurrency(transaction.total)}</span>
                    </div>
                    {transaction.amountPaid && (
                      <>
                        <div className="flex justify-between py-2 text-sm">
                          <span className="text-muted-foreground">Dibayar</span>
                          <span>{formatCurrency(transaction.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm">
                          <span className="text-muted-foreground">Kembalian</span>
                          <span>{formatCurrency(transaction.change || 0)}</span>
                        </div>
                      </>
                    )}
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
                placeholder="Cari transaksi..."
                value={search}
                onChange={handleSearch}
                className="pl-9 w-full bg-background/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <DateRangePicker 
                date={dateRange} 
                onDateChange={setDateRange} 
              />
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={exportToCSV}
              >
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {showFilters && (
            <GlassCard className="p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Filter Transaksi</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm mb-1 block">Status</label>
                  <Select 
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm mb-1 block">Metode Pembayaran</label>
                  <Select 
                    value={paymentMethodFilter}
                    onValueChange={setPaymentMethodFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Metode</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard className="overflow-hidden">
            {isLoadingTransactions ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                  <p className="text-muted-foreground">Memuat transaksi...</p>
                </div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">ID Transaksi</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">
                        <div className="flex items-center cursor-pointer" onClick={() => handleSort("date")}>
                          Tanggal & Waktu
                          <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "date" ? "text-primary" : ""}`} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Status</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Pembayaran</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">
                        <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("total")}>
                          Total
                          <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "total" ? "text-primary" : ""}`} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Barang</th>
                      <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Aksi</th>
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
                          <td className="py-3 px-4 text-center capitalize">{transaction.paymentMethod || "-"}</td>
                          <td className="py-3 px-4 text-right font-medium">{formatCurrency(transaction.total)}</td>
                          <td className="py-3 px-4 text-center">
                            {transaction.items?.length} item{transaction.items?.length !== 1 ? 's' : ''}
                          </td>
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
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedTransaction(transaction.id);
                                    setTimeout(() => handlePrintReceipt(), 100);
                                  }}
                                >
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
                  <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
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
