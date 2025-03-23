
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from "@/components/ui-custom/GlassCard";
import {
  Store as StoreIcon,
  Phone,
  MapPin,
  StickyNote,
  Upload,
  Check,
  X,
  Edit3,
  Image
} from "lucide-react";
import { SlideUpTransition } from "@/hooks/useTransition";
import { storeInfo } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const Store = () => {
  const [store, setStore] = useState(storeInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(store.logo || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStore({
      ...store,
      [name]: value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setStore(storeInfo);
    setPreviewImage(storeInfo.logo || null);
    setIsEditing(false);
  };

  const handleSave = () => {
    // Validate form fields
    if (!store.name || !store.whatsapp || !store.address) {
      toast({
        title: "Informasi tidak lengkap",
        description: "Mohon isi semua kolom yang diperlukan",
        variant: "destructive",
      });
      return;
    }
    
    // Save changes (in a real app, this would be an API call)
    toast({
      title: "Informasi toko diperbarui",
      description: "Perubahan berhasil disimpan",
    });
    
    setIsEditing(false);
  };

  return (
    <div className="container px-4 mx-auto max-w-4xl pb-8 animate-fade-in">
      <SlideUpTransition show={true} duration={300}>
        <GlassCard className="mt-6 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <StoreIcon className="h-5 w-5 text-primary" />
                Informasi Toko
              </h2>
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel} className="gap-1.5">
                      <X className="h-4 w-4" />
                      Batal
                    </Button>
                    <Button onClick={handleSave} className="gap-1.5 bg-primary hover:bg-primary/90">
                      <Check className="h-4 w-4" />
                      Simpan
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="gap-1.5">
                    <Edit3 className="h-4 w-4" />
                    Edit Informasi
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 flex flex-col items-center">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-muted/50 mb-4 relative shadow-md border border-muted">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Store Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Image className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center text-white">
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-xs">Ganti Logo</span>
                      </div>
                      <input 
                        type="file" 
                        id="logo-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <div className="text-center">
                  <h3 className="font-medium text-lg">{store.name}</h3>
                  <p className="text-muted-foreground text-sm">{store.address}</p>
                </div>
              )}
            </div>
            
            <div className="col-span-2 space-y-6">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Toko</label>
                <div className="relative">
                  <StoreIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    value={store.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama toko"
                    className="pl-10 bg-white/70 dark:bg-black/10 border-primary/20 focus-visible:ring-primary/30"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="whatsapp"
                    value={store.whatsapp}
                    onChange={handleChange}
                    placeholder="Masukkan nomor WhatsApp"
                    className="pl-10 bg-white/70 dark:bg-black/10 border-primary/20 focus-visible:ring-primary/30"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Alamat</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    name="address"
                    value={store.address}
                    onChange={handleChange}
                    placeholder="Masukkan alamat toko"
                    className="pl-10 min-h-[80px] bg-white/70 dark:bg-black/10 border-primary/20 focus-visible:ring-primary/30"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Catatan (Opsional)</label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    name="notes"
                    value={store.notes}
                    onChange={handleChange}
                    placeholder="Masukkan catatan tambahan tentang toko Anda"
                    className="pl-10 min-h-[80px] bg-white/70 dark:bg-black/10 border-primary/20 focus-visible:ring-primary/30"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};

export default Store;
