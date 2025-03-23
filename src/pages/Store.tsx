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
  X
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
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Save changes (in a real app, this would be an API call)
    toast({
      title: "Store information updated",
      description: "Your changes have been saved successfully",
    });
    
    setIsEditing(false);
  };

  return (
    <div className="container px-4 mx-auto max-w-4xl pb-8 animate-fade-in">
      <SlideUpTransition show={true} duration={300}>
        <GlassCard className="mt-6 overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Store Information</h2>
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Information
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 flex flex-col items-center">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-muted mb-4 relative">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Store Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <StoreIcon className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center text-white">
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-xs">Change Logo</span>
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
                <label className="text-sm font-medium mb-1 block">Store Name</label>
                <div className="relative">
                  <StoreIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    value={store.name}
                    onChange={handleChange}
                    placeholder="Enter store name"
                    className="pl-10"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="whatsapp"
                    value={store.whatsapp}
                    onChange={handleChange}
                    placeholder="Enter WhatsApp number"
                    className="pl-10"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    name="address"
                    value={store.address}
                    onChange={handleChange}
                    placeholder="Enter store address"
                    className="pl-10 min-h-[80px]"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    name="notes"
                    value={store.notes}
                    onChange={handleChange}
                    placeholder="Enter additional notes about your store"
                    className="pl-10 min-h-[80px]"
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
