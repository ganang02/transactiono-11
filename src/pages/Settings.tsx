
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlassCard from "@/components/ui-custom/GlassCard";
import StoreSettings from "@/components/settings/StoreSettings";
import PrinterSettings from "@/components/settings/PrinterSettings";
import DailySalesReport from "@/components/reports/DailySalesReport";
import MonthlySalesReport from "@/components/reports/MonthlySalesReport";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  Printer, 
  Store, 
  BarChart2, 
  BarChart,
  ArrowRight
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("printer"); // Changed default to printer

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in mt-6">
      <h1 className="text-2xl font-bold mb-6">Pengaturan & Laporan</h1>
      
      {/* New Alert for Printer Setup */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center">
          <AlertDescription className="text-blue-800">
            <span className="font-bold">Sambungkan printer thermal HS6632M</span> untuk mencetak struk transaksi.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
            onClick={() => setActiveTab("printer")}
          >
            <Printer className="h-4 w-4 mr-1" />
            Setup Printer
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </Alert>
      
      <Tabs 
        defaultValue="printer" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6 flex w-full overflow-x-auto bg-transparent p-0 gap-1">
          <TabsTrigger value="store" className="rounded-lg px-4 py-2 flex items-center gap-1">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Informasi Toko</span>
            <span className="inline sm:hidden">Toko</span>
          </TabsTrigger>
          <TabsTrigger value="printer" className="rounded-lg px-4 py-2 flex items-center gap-1">
            <Printer className="h-4 w-4" />
            <span>Printer</span>
          </TabsTrigger>
          <TabsTrigger value="daily-report" className="rounded-lg px-4 py-2 flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Laporan Harian</span>
            <span className="inline sm:hidden">Harian</span>
          </TabsTrigger>
          <TabsTrigger value="monthly-report" className="rounded-lg px-4 py-2 flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Laporan Bulanan</span>
            <span className="inline sm:hidden">Bulanan</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="store">
          <StoreSettings />
        </TabsContent>
        
        <TabsContent value="printer">
          <PrinterSettings />
        </TabsContent>
        
        <TabsContent value="daily-report">
          <DailySalesReport className="mb-6" />
        </TabsContent>
        
        <TabsContent value="monthly-report">
          <MonthlySalesReport className="mb-6" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
