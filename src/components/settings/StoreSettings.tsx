
import React, { useState } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreAPI } from "@/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Store, Save } from "lucide-react";

const StoreSettings = () => {
  const queryClient = useQueryClient();
  
  const { data: storeInfo, isLoading } = useQuery({
    queryKey: ['store'],
    queryFn: StoreAPI.getInfo,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    notes: '',
  });
  
  React.useEffect(() => {
    if (storeInfo) {
      setFormData({
        name: storeInfo.name || '',
        whatsapp: storeInfo.whatsapp || '',
        address: storeInfo.address || '',
        notes: storeInfo.notes || '',
      });
    }
  }, [storeInfo]);
  
  const mutation = useMutation({
    mutationFn: (data: any) => StoreAPI.updateInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store'] });
      toast({
        title: "Berhasil",
        description: "Informasi toko berhasil disimpan",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan informasi toko",
        variant: "destructive",
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Store className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Informasi Toko</h2>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-muted-foreground">Memuat informasi toko...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Toko</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama toko"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="Nomor WhatsApp (dengan 62)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Toko</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Alamat lengkap toko"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Struk</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Catatan yang akan muncul di struk (opsional)"
              rows={2}
            />
            <p className="text-sm text-muted-foreground">Catatan ini akan muncul di bagian bawah struk pembayaran</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full md:w-auto mt-4"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </form>
      )}
    </GlassCard>
  );
};

export default StoreSettings;
