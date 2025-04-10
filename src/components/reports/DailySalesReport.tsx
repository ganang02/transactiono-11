
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
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui-custom/DateRangePicker";
import { toast } from "@/hooks/use-toast";
import { startOfDay, endOfDay, isWithinInterval, parseISO, format } from "date-fns";
import { saveFile, processNumberForCSV } from "@/utils/fileExport";

interface DailySalesReportProps {
  className?: string;
}

interface SalesItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  revenue: number;
}

const DailySalesReport = ({ className }: DailySalesReportProps) => {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', dateRange?.from, dateRange?.to],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/transactions`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch transactions');
        }
        return res.json();
      })
      .catch(error => {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Gagal memuat data",
          description: "Menggunakan data offline untuk preview",
          variant: "destructive"
        });
        return [];
      }),
  });

  const getSalesData = () => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const salesMap = new Map<string, SalesItem>();
    
    transactions.forEach((transaction: any) => {
      // Only include completed transactions
      if (transaction.payment_status !== 'completed') {
        return;
      }
      
      // Filter by date range if provided
      const transactionDate = parseISO(transaction.date);
      if (dateRange?.from && dateRange?.to) {
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to || dateRange.from);
        
        if (!isWithinInterval(transactionDate, { start, end })) {
          return;
        }
      }
      
      if (!transaction.items || !Array.isArray(transaction.items)) {
        return;
      }
      
      transaction.items.forEach((item: any) => {
        const key = item.product_id || item.productId;
        const name = item.product_name || item.productName;
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const subtotal = Number(item.subtotal) || 0;
        
        if (salesMap.has(key)) {
          const existing = salesMap.get(key)!;
          existing.quantity += quantity;
          existing.revenue += subtotal;
        } else {
          salesMap.set(key, {
            productId: key,
            productName: name,
            quantity: quantity,
            price: price,
            revenue: subtotal
          });
        }
      });
    });
    
    return Array.from(salesMap.values());
  };
  
  const salesData = getSalesData();
  
  const filteredSales = salesData.filter(item => 
    item.productName.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalQuantity = filteredSales.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalRevenue = filteredSales.reduce((acc, item) => acc + (item.revenue || 0), 0);
  
  const exportToExcel = async () => {
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
      const dateRangeText = dateRange?.from 
        ? (dateRange.to 
          ? `${format(dateRange.from, 'dd-MM-yyyy')}_sampai_${format(dateRange.to, 'dd-MM-yyyy')}` 
          : format(dateRange.from, 'dd-MM-yyyy'))
        : 'semua_waktu';
      
      const headers = ["Nama Produk", "Jumlah Terjual", "Harga Satuan", "Total Pendapatan"];
      
      const csvData = filteredSales.map(item => [
        item.productName,
        item.quantity.toString(),
        processNumberForCSV(item.price),
        processNumberForCSV(item.revenue)
      ]);
      
      // Add total row
      csvData.push([
        "TOTAL", 
        totalQuantity.toString(), 
        "", 
        processNumberForCSV(totalRevenue)
      ]);
      
      // Format the CSV content
      let csvContent = headers.join(",") + "\n";
      
      csvData.forEach(row => {
        const formattedRow = row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });
        csvContent += formattedRow.join(",") + "\n";
      });
      
      const fileName = `laporan_penjualan_${dateRangeText}.csv`;
      
      const success = await saveFile(fileName, csvContent, "text/csv;charset=utf-8;");
      
      if (success) {
        toast({
          title: "Ekspor berhasil",
          description: "Laporan penjualan berhasil diekspor"
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ekspor gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <GlassCard className={`p-4 overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold">Laporan Penjualan</h2>
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
          <DateRangePicker 
            date={dateRange} 
            onDateChange={setDateRange} 
          />
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
            {isTransactionsLoading ? (
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
                  Tidak ada data penjualan untuk periode yang dipilih
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredSales.length > 0 && (
        <div className="mt-4 text-right">
          <div className="inline-block bg-muted/20 p-3 rounded-lg">
            <h3 className="text-lg font-semibold mb-1">Total Pendapatan: {formatCurrency(totalRevenue || 0)}</h3>
            <p className="text-sm text-muted-foreground">Total Produk Terjual: {totalQuantity}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default DailySalesReport;
