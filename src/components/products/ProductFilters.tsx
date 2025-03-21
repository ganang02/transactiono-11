
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  stockFilter: "all" | "low" | "out";
  onStockFilterChange: (filter: "all" | "low" | "out") => void;
  onClose: () => void;
}

const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  onClose
}: ProductFiltersProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <SlideUpTransition show={true}>
        <GlassCard className="w-full max-w-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Filter Produk</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <Select 
                value={selectedCategory || ""} 
                onValueChange={(value) => onCategoryChange(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua kategori</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Stok</label>
              <Select 
                value={stockFilter} 
                onValueChange={(value: "all" | "low" | "out") => onStockFilterChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter stok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua stok</SelectItem>
                  <SelectItem value="low">Stok rendah (&lt; 10)</SelectItem>
                  <SelectItem value="out">Habis stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  onCategoryChange(null);
                  onStockFilterChange("all");
                }}
              >
                Reset
              </Button>
              <Button onClick={onClose}>
                Terapkan
              </Button>
            </div>
          </div>
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};

export default ProductFilters;
