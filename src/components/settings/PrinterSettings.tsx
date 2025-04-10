
import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { Printer, Bluetooth, AlertTriangle, Info, FileText, Send, RefreshCw } from "lucide-react";
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
    devices,
    printReceipt,
    isPrinting,
    isConnecting,
    connectToDevice
  } = useBluetoothPrinter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Debug info for troubleshooting
    setDebugInfo(`Platform: ${isNative ? 'Native' : 'Web'}, Permissions: ${permissionsGranted ? 'Granted' : 'Not granted'}`);
  }, [isNative, permissionsGranted]);

  // Auto-check permissions on load
  useEffect(() => {
    if (isNative && !permissionsGranted) {
      checkBluetoothPermissions();
    }
  }, []);

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
  
  const handlePrintTest = async () => {
    try {
      if (!selectedDevice) {
        // Jika belum ada printer terpilih, buka modal
        setIsModalOpen(true);
        return;
      }
      
      // Sample receipt data for testing
      const testReceiptData = {
        storeName: "Toko Test",
        storeAddress: "Jl. Test No. 123, Jakarta",
        storeWhatsapp: "08123456789",
        transactionId: "TEST-001",
        date: new Date().toLocaleString("id-ID"),
        items: [
          { name: "Produk Test 1", quantity: 2, price: 15000, subtotal: 30000 },
          { name: "Produk Test 2", quantity: 1, price: 25000, subtotal: 25000 }
        ],
        subtotal: 55000,
        tax: 5500,
        total: 60500,
        paymentMethod: "Cash",
        amountPaid: 100000,
        change: 39500,
        notes: "Terima kasih telah berbelanja!"
      };
      
      await printReceipt(testReceiptData);
      
      toast({
        title: "Test Print",
        description: "Struk test berhasil dikirim ke printer",
      });
    } catch (error) {
      console.error("Error printing test receipt:", error);
      toast({
        title: "Gagal Mencetak",
        description: "Terjadi kesalahan saat mencoba mencetak struk test",
        variant: "destructive",
      });
    }
  };

  // New simplified function that combines scan and connect
  const handleQuickConnect = async () => {
    try {
      // 1. Check permissions first
      if (isNative && !permissionsGranted) {
        const granted = await checkBluetoothPermissions();
        if (!granted) {
          toast({
            title: "Izin Diperlukan",
            description: "Mohon berikan izin Bluetooth untuk melanjutkan",
            variant: "destructive",
          });
          return;
        }
      }
      
      // 2. Show scanning toast
      toast({
        title: "Mencari Printer",
        description: "Sedang mencari printer HS6632M dan printer lainnya...",
      });
      
      // 3. Scan for devices
      const foundDevices = await scanForDevices();
      
      // 4. If no devices found, show error
      if (foundDevices.length === 0) {
        toast({
          title: "Tidak Ditemukan",
          description: "Tidak ada printer ditemukan. Pastikan printer menyala dan dalam mode pairing.",
          variant: "destructive",
        });
        return;
      }
      
      // 5. Try to find HS6632M specifically
      let targetDevice = foundDevices.find(d => d.name?.includes('HS6632M') || d.name?.includes('HS'));
      
      // 6. If not found, use the first device
      if (!targetDevice) {
        targetDevice = foundDevices[0];
      }
      
      // 7. Connect to the device
      toast({
        title: "Menghubungkan",
        description: `Menghubungkan ke ${targetDevice.name || 'printer'}...`,
      });
      
      await connectToDevice(targetDevice.id);
      
      // 8. Success toast
      toast({
        title: "Terhubung!",
        description: `Berhasil terhubung ke ${targetDevice.name || 'printer'}`,
      });
      
      // 9. Auto print test page
      handlePrintTest();
      
    } catch (error) {
      console.error("Error in quick connect:", error);
      toast({
        title: "Gagal Terhubung",
        description: "Gagal menghubungkan ke printer. Coba lagi atau buka menu printer lengkap.",
        variant: "destructive",
      });
    }
  };

  const handleDirectScan = async () => {
    try {
      // Pastikan izin sudah diberikan
      if (!permissionsGranted) {
        const granted = await checkBluetoothPermissions();
        if (!granted) {
          toast({
            title: "Izin Diperlukan",
            description: "Mohon berikan izin Bluetooth untuk melanjutkan",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Mulai scan
      toast({
        title: "Memindai Printer",
        description: "Mohon tunggu sementara kami mencari printer di sekitar",
      });
      
      await scanForDevices();
      
      // Buka modal untuk memilih printer
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error during direct scan:", error);
      toast({
        title: "Pemindaian Gagal",
        description: "Terjadi kesalahan saat memindai printer",
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrintTest}
                  disabled={isPrinting}
                  className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {isPrinting ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Test Print
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={disconnectFromDevice}
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Putuskan
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Tidak ada printer yang terhubung</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {/* New one-click connect and print button */}
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 col-span-1 sm:col-span-2"
                  onClick={handleQuickConnect}
                  disabled={isScanning || isConnecting}
                >
                  {isScanning || isConnecting ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Connect & Print HS6632M
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={handleDirectScan}
                  disabled={isScanning || isConnecting}
                >
                  {isScanning || isConnecting ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Bluetooth className="h-4 w-4 mr-2" />
                  )}
                  Cari & Hubungkan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                >
                  Pengaturan Printer
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Panduan HS6632M
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Nyalakan printer thermal HS6632M dan tunggu lampu indikator menyala</li>
            <li>Pastikan printer dalam mode pairing (tombol biru atau lampu berkedip)</li>
            <li>Klik tombol <b>"Connect & Print HS6632M"</b> untuk sekali klik terhubung dan mencoba print</li>
            <li>Jika gagal, gunakan <b>"Cari & Hubungkan"</b> dan pilih printer secara manual</li>
            <li>Untuk printer non-HS6632M, gunakan menu pengaturan printer lengkap</li>
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
