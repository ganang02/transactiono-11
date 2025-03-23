
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { Spinner } from "@/components/ui/spinner";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { takePhoto, convertPhotoToBase64 } from "@/utils/imageUtils";
import { toast } from "@/hooks/use-toast";

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
    category: "",
    imageUrl: "",
    imageBase64: null as string | null
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setEditedProduct({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        imageUrl: product.imageUrl || "",
        imageBase64: null
      });
      
      if (product.imageUrl) {
        setPhotoPreview(product.imageUrl);
      }
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value
    });
  };
  
  const handleTakePhoto = async () => {
    try {
      const photoUri = await takePhoto();
      if (photoUri) {
        setPhotoPreview(photoUri);
        
        // Convert to base64 for API upload
        const base64Data = await convertPhotoToBase64(photoUri);
        setEditedProduct({
          ...editedProduct,
          imageBase64: base64Data
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast({
        title: "Gagal mengambil foto",
        description: "Terjadi kesalahan saat mengambil foto",
        variant: "destructive"
      });
    }
  };
  
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setEditedProduct({
      ...editedProduct,
      imageUrl: "",
      imageBase64: null
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
            
            <div>
              <label className="text-sm font-medium mb-2 block">Gambar Produk</label>
              
              {photoPreview ? (
                <div className="relative w-full h-40 mb-2">
                  <img 
                    src={photoPreview} 
                    alt="Product preview" 
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md py-8 flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-sm">Belum ada gambar</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-2 gap-2"
                onClick={handleTakePhoto}
              >
                <Camera className="h-4 w-4" />
                Ambil Foto
              </Button>
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
