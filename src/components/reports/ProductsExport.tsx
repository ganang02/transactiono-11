import React, { useState } from "react";
import { FileDown, File, X, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { formatCurrency } from "@/api/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface ProductsExportProps {
  products: any[];
  onClose: () => void;
}

const ProductsExport = ({
  products,
  onClose
}: ProductsExportProps) => {
  const [format, setFormat] = useState<"csv">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (products.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada produk untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Set filename with current date
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `products_${dateStr}`;
      
      // Create CSV content
      const headers = ["ID", "Nama Produk", "Kategori", "Harga", "Stok"];
      const rows = products.map(product => [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock
      ]);
      
      // Convert to CSV format
      const content = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      // Create a download link and trigger download
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        
        toast({
          title: "Ekspor berhasil",
          description: `Data produk berhasil diekspor sebagai CSV`,
        });
        
        onClose();
      }, 100);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      toast({
        title: "Ekspor gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <SlideUpTransition show={true}>
        <GlassCard className="w-full max-w-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Ekspor Data Produk</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Ekspor {products.length} produk sebagai file Excel (CSV) yang dapat dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button 
                onClick={handleExport} 
                className="gap-2"
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
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};

export default ProductsExport;
