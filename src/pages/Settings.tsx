
import React, { useState } from "react";
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

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [language, setLanguage] = useState("en");

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
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
                  onCheckedChange={setNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound Effects</p>
                  <p className="text-sm text-muted-foreground">Play sound when completing a transaction</p>
                </div>
                <Switch 
                  checked={sound} 
                  onCheckedChange={setSound} 
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
                  onCheckedChange={setPrintReceipt} 
                />
              </div>
              
              <Button variant="outline" className="w-full justify-between">
                <span>Configure Printer</span>
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
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              <div>
                <p className="font-medium mb-2">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={language === "en" ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => setLanguage("en")}
                  >
                    <span>English</span>
                    {language === "en" && <Check className="h-4 w-4" />}
                  </Button>
                  
                  <Button 
                    variant={language === "id" ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => setLanguage("id")}
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
    </div>
  );
};

export default Settings;
