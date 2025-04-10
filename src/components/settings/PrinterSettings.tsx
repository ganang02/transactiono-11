
import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { Printer, Bluetooth, AlertTriangle, Info } from "lucide-react";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Capacitor } from "@capacitor/core";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const PrinterSettings = () => {
  const { 
    selectedDevice, 
    isScanning, 
    scanForDevices, 
    disconnectFromDevice,
    permissionsGranted,
    checkBluetoothPermissions,
    devices
  } = useBluetoothPrinter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Debug info for troubleshooting
    setDebugInfo(`Platform: ${isNative ? 'Native' : 'Web'}, Permissions: ${permissionsGranted ? 'Granted' : 'Not granted'}`);
  }, [isNative, permissionsGranted]);

  const handlePrinterSelected = () => {
    toast({
      title: "Printer terhubung",
      description: selectedDevice ? `Terhubung ke ${selectedDevice.name}` : "",
    });
    setIsModalOpen(false);
  };

  const handleCheckPermissions = async () => {
    try {
      const result = await checkBluetoothPermissions();
      if (result) {
        toast({
          title: "Izin Bluetooth",
          description: "Izin Bluetooth telah diberikan",
        });
      } else {
        toast({
          title: "Izin Bluetooth",
          description: "Izin Bluetooth belum diberikan, mohon berikan izin di pengaturan perangkat",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      toast({
        title: "Error",
        description: "Gagal memeriksa izin Bluetooth",
        variant: "destructive",
      });
    }
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-semibold mb-6">Pengaturan Printer</h2>
      
      {!permissionsGranted && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Izin Bluetooth diperlukan</AlertTitle>
          <AlertDescription>
            Aplikasi memerlukan izin Bluetooth dan Lokasi untuk mendeteksi printer. 
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={handleCheckPermissions}
            >
              Periksa Izin
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-medium mb-2">Printer Bluetooth</h3>
          {selectedDevice ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Printer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedDevice.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDevice.id}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnectFromDevice}
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Putuskan
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Tidak ada printer yang terhubung</p>
              <Button 
                className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => setIsModalOpen(true)}
              >
                <Bluetooth className="h-4 w-4 mr-2" />
                Cari printer Bluetooth
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Panduan Penggunaan
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Pastikan printer Bluetooth Anda sudah menyala dan ada di sekitar perangkat</li>
            <li>Klik tombol "Cari printer Bluetooth" untuk memindai perangkat di sekitar</li>
            <li>Pilih printer dari daftar yang muncul</li>
            <li>Setelah terhubung, Anda dapat mencetak struk dari halaman transaksi</li>
          </ol>
        </div>
        
        {isNative && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium mb-2 text-blue-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informasi Perangkat
            </h3>
            <p className="text-sm text-blue-600">{debugInfo}</p>
            <p className="text-sm mt-2 text-blue-800">
              Jumlah perangkat terdeteksi: {devices.length}
            </p>
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCheckPermissions}
              >
                Periksa Izin Bluetooth
              </Button>
            </div>
          </div>
        )}
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
