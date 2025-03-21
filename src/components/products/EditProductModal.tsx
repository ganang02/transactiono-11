
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { Spinner } from "@/components/ui/spinner";

interface EditProductModalProps {
  product: any;
  onClose: () => void;
  onSave: (product: any) => void;
  isLoading: boolean;
}

export const EditProductModal = ({
  product,
  onClose,
  onSave,
  isLoading
}: EditProductModalProps) => {
  const [editedProduct, setEditedProduct] = useState({
    id: "",
    name: "",
    price: "",
    stock: "",
    category: ""
  });

  useEffect(() => {
    if (product) {
      setEditedProduct({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value
    });
  };

  const handleSubmit = () => {
    const updatedProduct = {
      ...editedProduct,
      price: parseFloat(editedProduct.price),
      stock: parseInt(editedProduct.stock)
    };
    onSave(updatedProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <SlideUpTransition show={true}>
        <GlassCard className="w-full max-w-md">
          <div className="p-4 border-b">
            <h2 className="font-medium">Edit Produk</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama Produk</label>
              <Input 
                name="name" 
                value={editedProduct.name} 
                onChange={handleInputChange} 
                placeholder="Masukkan nama produk" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Harga</label>
                <Input 
                  name="price" 
                  value={editedProduct.price} 
                  onChange={handleInputChange} 
                  placeholder="Masukkan harga" 
                  type="number"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Stok</label>
                <Input 
                  name="stock" 
                  value={editedProduct.stock} 
                  onChange={handleInputChange} 
                  placeholder="Masukkan stok" 
                  type="number"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Kategori</label>
              <Input 
                name="category" 
                value={editedProduct.category} 
                onChange={handleInputChange} 
                placeholder="Masukkan kategori" 
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};
