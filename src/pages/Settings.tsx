
import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Printer, 
  Languages, 
  HelpCircle, 
  Info, 
  LogOut,
  Check,
  ChevronRight,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import GlassCard from "@/components/ui-custom/GlassCard";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { useNavigate } from "react-router-dom";

// Create a key for storing settings
const SETTINGS_STORAGE_KEY = 'pos-system-settings';

const Settings = () => {
  const navigate = useNavigate();
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const { selectedDevice } = useBluetoothPrinter();
  
  // App settings with localStorage persistence - fixing type issues
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-notifications`) === 'true' || true;
  });
  
  const [sound, setSound] = useState<boolean>(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-sound`) === 'true' || true;
  });
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-darkMode`) === 'true' || false;
  });
  
  const [printReceipt, setPrintReceipt] = useState<boolean>(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-printReceipt`) === 'true' || true;
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-language`) || "en";
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}-notifications`, notifications.toString());
  }, [notifications]);
  
  useEffect(() => {
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}-sound`, sound.toString());
  }, [sound]);
  
  useEffect(() => {
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}-darkMode`, darkMode.toString());
    // Apply dark mode to the document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  useEffect(() => {
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}-printReceipt`, printReceipt.toString());
  }, [printReceipt]);
  
  useEffect(() => {
    localStorage.setItem(`${SETTINGS_STORAGE_KEY}-language`, language);
    // You would implement actual language change logic here
  }, [language]);

  const handleLogout = () => {
    // Clear any user session data here
    localStorage.removeItem('user-session');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
    
    // Navigate to home page
    navigate('/');
  };

  const openPrinterConfig = () => {
    setShowPrinterModal(true);
  };

  const handlePrinterSelected = () => {
    toast({
      title: "Printer configured",
      description: "Your printer has been successfully configured"
    });
  };

  return (
    <div className="container px-4 mx-auto max-w-4xl pb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2 text-primary" />
          Pengaturan Aplikasi
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <SlideUpTransition show={true} duration={300}>
          <GlassCard className="overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Notifikasi</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Aktifkan Notifikasi</p>
                    <p className="text-sm text-muted-foreground">Terima pemberitahuan tentang transaksi dan aktivitas penting</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={(checked) => {
                    setNotifications(checked);
                    toast({
                      title: checked ? "Notifikasi diaktifkan" : "Notifikasi dinonaktifkan",
                      description: checked ? "Anda akan menerima notifikasi" : "Anda tidak akan menerima notifikasi"
                    });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  {sound ? <Volume2 className="h-5 w-5 text-primary mt-0.5" /> : <VolumeX className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <p className="font-medium">Efek Suara</p>
                    <p className="text-sm text-muted-foreground">Putar suara saat menyelesaikan transaksi</p>
                  </div>
                </div>
                <Switch 
                  checked={sound} 
                  onCheckedChange={(checked) => {
                    setSound(checked);
                    toast({
                      title: checked ? "Efek suara diaktifkan" : "Efek suara dinonaktifkan"
                    });
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={400}>
          <GlassCard className="overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center">
                <Printer className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Printer</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Printer className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Cetak Struk Otomatis</p>
                    <p className="text-sm text-muted-foreground">Otomatis cetak struk setelah setiap transaksi</p>
                  </div>
                </div>
                <Switch 
                  checked={printReceipt} 
                  onCheckedChange={(checked) => {
                    setPrintReceipt(checked);
                    toast({
                      title: checked ? "Cetak otomatis diaktifkan" : "Cetak otomatis dinonaktifkan"
                    });
                  }}
                />
              </div>
              
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-primary/5 border-primary/20" 
                onClick={openPrinterConfig}
              >
                <div className="flex items-center">
                  <Printer className="h-4 w-4 mr-2 text-primary" />
                  <span>Konfigurasi Printer {selectedDevice && `(${selectedDevice.name})`}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={500}>
          <GlassCard className="overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Tampilan</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  {darkMode ? <Moon className="h-5 w-5 text-primary mt-0.5" /> : <Sun className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <p className="font-medium">Mode Gelap</p>
                    <p className="text-sm text-muted-foreground">Gunakan tema gelap untuk aplikasi</p>
                  </div>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={(checked) => {
                    setDarkMode(checked);
                    toast({
                      title: checked ? "Mode gelap diaktifkan" : "Mode terang diaktifkan"
                    });
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  Bahasa
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={language === "en" ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => {
                      setLanguage("en");
                      toast({
                        title: "Language changed",
                        description: "Language set to English"
                      });
                    }}
                  >
                    <span>English</span>
                    {language === "en" && <Check className="h-4 w-4" />}
                  </Button>
                  
                  <Button 
                    variant={language === "id" ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => {
                      setLanguage("id");
                      toast({
                        title: "Bahasa diubah",
                        description: "Bahasa diatur ke Bahasa Indonesia"
                      });
                    }}
                  >
                    <span>Indonesian</span>
                    {language === "id" && <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={600}>
          <GlassCard className="overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b bg-primary/10">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Bantuan & Dukungan</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-3">
              <Button variant="outline" className="w-full justify-between hover:bg-primary/5 border-primary/20">
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2 text-primary" />
                  <span>Panduan Pengguna</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="w-full justify-between hover:bg-primary/5 border-primary/20">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-primary" />
                  <span>Hubungi Dukungan</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </SlideUpTransition>
      </div>
      
      <SlideUpTransition show={true} duration={700}>
        <div className="mt-8 flex justify-center">
          <Button 
            variant="destructive" 
            className="gap-2 px-6 py-5 text-lg font-medium rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </div>
      </SlideUpTransition>

      <BluetoothPrinterModal 
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onPrinterSelected={handlePrinterSelected}
        previewTransaction={null}
        previewStoreInfo={null}
      />
    </div>
  );
};

export default Settings;
