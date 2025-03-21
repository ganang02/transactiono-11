
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
  ChevronRight
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
  
  // App settings with localStorage persistence
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-notifications`) === 'true' || true;
  });
  
  const [sound, setSound] = useState(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-sound`) === 'true' || true;
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(`${SETTINGS_STORAGE_KEY}-darkMode`) === 'true' || false;
  });
  
  const [printReceipt, setPrintReceipt] = useState(() => {
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
      <div className="grid grid-cols-1 gap-6 mt-6">
        <SlideUpTransition show={true} duration={300}>
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Notifications</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for important events</p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={(checked) => {
                    setNotifications(checked);
                    toast({
                      title: checked ? "Notifications enabled" : "Notifications disabled",
                      description: checked ? "You will now receive notifications" : "You will no longer receive notifications"
                    });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound Effects</p>
                  <p className="text-sm text-muted-foreground">Play sound when completing a transaction</p>
                </div>
                <Switch 
                  checked={sound} 
                  onCheckedChange={(checked) => {
                    setSound(checked);
                    toast({
                      title: checked ? "Sound effects enabled" : "Sound effects disabled"
                    });
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={400}>
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <Printer className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Printing</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-print Receipt</p>
                  <p className="text-sm text-muted-foreground">Automatically print receipt after each transaction</p>
                </div>
                <Switch 
                  checked={printReceipt} 
                  onCheckedChange={(checked) => {
                    setPrintReceipt(checked);
                    toast({
                      title: checked ? "Auto-print enabled" : "Auto-print disabled"
                    });
                  }}
                />
              </div>
              
              <Button variant="outline" className="w-full justify-between" onClick={openPrinterConfig}>
                <span>Configure Printer {selectedDevice && `(${selectedDevice.name})`}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={500}>
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Appearance</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme for the application</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={(checked) => {
                    setDarkMode(checked);
                    toast({
                      title: checked ? "Dark mode enabled" : "Light mode enabled"
                    });
                  }}
                />
              </div>
              
              <div>
                <p className="font-medium mb-2">Language</p>
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
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                <h2 className="font-medium">Help & Support</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span>User Guide</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <span>Contact Support</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </SlideUpTransition>
        
        <SlideUpTransition show={true} duration={700}>
          <Button 
            variant="destructive" 
            className="gap-2 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </SlideUpTransition>
      </div>

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
