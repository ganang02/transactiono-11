
import React, { useState } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { Printer, Bluetooth } from "lucide-react";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

const PrinterSettings = () => {
  const { 
    selectedDevice, 
    isScanning, 
    scanForDevices, 
    disconnectFromDevice,
    permissionsGranted,
    checkBluetoothPermissions
  } = useBluetoothPrinter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrinterSelected = () => {
    toast({
      title: "Printer terhubung",
      description: selectedDevice ? `Terhubung ke ${selectedDevice.name}` : "",
    });
    setIsModalOpen(false);
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-semibold mb-6">Pengaturan Printer</h2>
      
      <div className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Printer Bluetooth</h3>
          {selectedDevice ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedDevice.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDevice.id}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnectFromDevice}>
                Putuskan
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Tidak ada printer yang terhubung</p>
              <Button 
                className="mt-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Bluetooth className="h-4 w-4 mr-2" />
                Cari printer Bluetooth
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Panduan Penggunaan</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Pastikan printer Bluetooth Anda sudah menyala dan ada di sekitar perangkat</li>
            <li>Klik tombol "Cari printer Bluetooth" untuk memindai perangkat di sekitar</li>
            <li>Pilih printer dari daftar yang muncul</li>
            <li>Setelah terhubung, Anda dapat mencetak struk dari halaman transaksi</li>
          </ol>
        </div>
      </div>

      <BluetoothPrinterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPrinterSelected={handlePrinterSelected}
      />
    </GlassCard>
  );
};

export default PrinterSettings;
