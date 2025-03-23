
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlassCard from "@/components/ui-custom/GlassCard";
import StoreSettings from "@/components/settings/StoreSettings";
import PrinterSettings from "@/components/settings/PrinterSettings";
import DailySalesReport from "@/components/reports/DailySalesReport";
import MonthlySalesReport from "@/components/reports/MonthlySalesReport";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in mt-6">
      <h1 className="text-2xl font-bold mb-6">Pengaturan & Laporan</h1>
      
      <Tabs defaultValue="store" className="w-full">
        <TabsList className="mb-6 flex w-full overflow-x-auto bg-transparent p-0 gap-1">
          <TabsTrigger value="store" className="rounded-lg px-4 py-2">
            Informasi Toko
          </TabsTrigger>
          <TabsTrigger value="printer" className="rounded-lg px-4 py-2">
            Printer
          </TabsTrigger>
          <TabsTrigger value="daily-report" className="rounded-lg px-4 py-2">
            Laporan Harian
          </TabsTrigger>
          <TabsTrigger value="monthly-report" className="rounded-lg px-4 py-2">
            Laporan Bulanan
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
