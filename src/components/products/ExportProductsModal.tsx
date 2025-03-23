
import React, { useState } from "react";
import { X, FileDown, FileText, Save } from "lucide-react";
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
import { saveFile } from "@/utils/fileExport";

interface ExportProductsModalProps {
  products: any[];
  onClose: () => void;
}

const ExportProductsModal = ({
  products,
  onClose
}: ExportProductsModalProps) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
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
      let content: string;
      let filename: string;
      let type: string;

      if (format === "csv") {
        // Create CSV content
        const headers = ["Nama Produk", "Kategori", "Harga", "Stok"];
        const rows = products.map(product => [
          product.name,
          product.category,
          product.price,
          product.stock
        ]);
        
        // Convert to CSV format
        content = [
          headers.join(","),
          ...rows.map(row => row.join(","))
        ].join("\n");
        
        filename = `products_export_${new Date().toISOString().split("T")[0]}.csv`;
        type = "text/csv";
      } else {
        // Export as JSON
        const exportData = products.map(product => ({
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock
        }));
        
        content = JSON.stringify(exportData, null, 2);
        filename = `products_export_${new Date().toISOString().split("T")[0]}.json`;
        type = "application/json";
      }

      const success = await saveFile(filename, content, type);
      
      if (success) {
        toast({
          title: "Ekspor berhasil",
          description: `Data produk berhasil diekspor sebagai ${format.toUpperCase()}`,
        });
        
        onClose();
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ekspor gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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
            <div className="text-sm text-muted-foreground mb-2">
              Ekspor {products.length} produk sebagai file:
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Format File</label>
              <Select value={format} onValueChange={(value: "csv" | "json") => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      JSON
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <FileDown className="h-4 w-4" />
                Ekspor
              </Button>
            </div>
          </div>
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};

export default ExportProductsModal;
