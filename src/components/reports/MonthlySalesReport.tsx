
import React, { useState } from "react";
import { Calendar, FileDown, Search, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/api";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, getYear, getMonth } from "date-fns";

interface MonthlySalesReportProps {
  className?: string;
}

interface SalesItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  revenue: number;
}

interface MonthOption {
  value: string;
  label: string;
}

const MonthlySalesReport = ({ className }: MonthlySalesReportProps) => {
  const [search, setSearch] = useState("");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [isExporting, setIsExporting] = useState(false);

  // Get all transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/transactions`).then(res => res.json()),
  });

  // Generate options for years (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));
  
  // Generate options for months
  const monthOptions: MonthOption[] = [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" }
  ];

  // Process transactions to get monthly sales
  const getSalesData = () => {
    if (!transactions) return [];
    
    const salesMap = new Map<string, SalesItem>();
    
    const startDate = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
    const endDate = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
    
    transactions.forEach((transaction: any) => {
      // Skip non-completed transactions
      if (transaction.payment_status !== 'completed' && transaction.status !== 'completed') {
        return;
      }
      
      // Check if transaction is within selected month
      const transactionDate = parseISO(transaction.date);
      if (!isWithinInterval(transactionDate, { start: startDate, end: endDate })) {
        return;
      }
      
      // Process transaction items
      transaction.items.forEach((item: any) => {
        const key = item.product_id || item.productId;
        const name = item.product_name || item.productName;
        
        if (salesMap.has(key)) {
          const existing = salesMap.get(key)!;
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          salesMap.set(key, {
            productId: key,
            productName: name,
            quantity: item.quantity,
            price: item.price,
            revenue: item.subtotal
          });
        }
      });
    });
    
    return Array.from(salesMap.values());
  };
  
  const salesData = getSalesData();
  
  // Filter by search
  const filteredSales = salesData.filter(item => 
    item.productName.toLowerCase().includes(search.toLowerCase())
  );
  
  // Calculate totals
  const totalQuantity = filteredSales.reduce((acc, item) => acc + item.quantity, 0);
  const totalRevenue = filteredSales.reduce((acc, item) => acc + item.revenue, 0);
  
  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada penjualan untuk diekspor",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
      const filename = `sales_report_${monthName}_${selectedYear}`;
      
      const headers = ["Nama Produk", "Jumlah Terjual", "Harga Satuan", "Total Pendapatan"];
      
      const csvData = filteredSales.map(item => [
        item.productName,
        item.quantity,
        item.price,
        item.revenue
      ]);
      
      // Add total row
      csvData.push(["TOTAL", totalQuantity, "", totalRevenue]);
      
      let csvContent = headers.join(",") + "\n";
      
      csvData.forEach(row => {
        const formattedRow = row.map(cell => {
          // Check if cell is a string and contains commas, then wrap it in quotes
          if (typeof cell === 'string' && cell.includes(',')) {
            return `"${cell}"`;
          }
          return cell;
        });
        csvContent += formattedRow.join(",") + "\n";
      });
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        
        toast({
          title: "Ekspor berhasil",
          description: "Laporan penjualan bulanan berhasil diekspor ke Excel"
        });
      }, 100);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      toast({
        title: "Ekspor gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive"
      });
    }
  };

  return (
    <GlassCard className={`p-4 overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Laporan Penjualan Bulanan</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-background/50 backdrop-blur-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 whitespace-nowrap"
            onClick={exportToExcel}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                <span>Mengekspor...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Ekspor ke Excel</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Produk</TableHead>
              <TableHead className="text-center">Jumlah Terjual</TableHead>
              <TableHead className="text-center">Harga Satuan</TableHead>
              <TableHead className="text-right">Total Pendapatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSales.length > 0 ? (
              <>
                {filteredSales.map((item, index) => (
                  <SlideUpTransition key={item.productId} show={true} duration={300 + index * 30}>
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  </SlideUpTransition>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-center font-bold">{totalQuantity}</TableCell>
                  <TableCell className="text-center"></TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalRevenue)}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Tidak ada data penjualan untuk bulan {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
};

export default MonthlySalesReport;
