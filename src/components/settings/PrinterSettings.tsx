
import React, { useState, useEffect } from "react";
import GlassCard from "@/components/ui-custom/GlassCard";
import { Button } from "@/components/ui/button";
import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { Printer, Bluetooth, AlertTriangle, Info, FileText, Send, RefreshCw, Settings } from "lucide-react";
import BluetoothPrinterModal from "@/components/ui-custom/BluetoothPrinterModal";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Capacitor } from "@capacitor/core";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
    connectToDevice,
    getSystemBluetoothDevices,
    connectToSystemDevice
  } = useBluetoothPrinter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [systemDevices, setSystemDevices] = useState<any[]>([]);
  const [isLoadingSystemDevices, setIsLoadingSystemDevices] = useState(false);
  const [directConnectError, setDirectConnectError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Debug info for troubleshooting
  useEffect(() => {
    setDebugInfo(`Platform: ${isNative ? 'Native' : 'Web'}, Permissions: ${permissionsGranted ? 'Granted' : 'Not granted'}`);
  }, [isNative, permissionsGranted]);

  // Auto-check permissions on load
  useEffect(() => {
    if (isNative && !permissionsGranted) {
      checkBluetoothPermissions();
    }
  }, []);

  // Load system paired Bluetooth devices 
  const loadSystemDevices = async () => {
    try {
      setIsLoadingSystemDevices(true);
      setDirectConnectError(null);
      
      // Get system Bluetooth devices
      const devices = await getSystemBluetoothDevices();
      console.log("System Bluetooth devices:", devices);
      
      // Filter for likely printer devices
      const printerDevices = devices.filter(device => {
        const name = (device.name || "").toLowerCase();
        return (
          name.includes("hs") || 
          name.includes("printer") || 
          name.includes("print") || 
          name.includes("thermal") || 
          name.includes("pos") ||
          name.includes("6632")
        );
      });
      
      setSystemDevices(printerDevices.length > 0 ? printerDevices : devices);
      
      if (devices.length === 0) {
        setDirectConnectError("Tidak ada perangkat Bluetooth yang terpasang. Pastikan printer sudah di-pairing di pengaturan Bluetooth perangkat Anda.");
      }
    } catch (error) {
      console.error("Error loading system devices:", error);
      setDirectConnectError("Gagal memuat perangkat Bluetooth. Pastikan Bluetooth aktif dan izin diberikan.");
    } finally {
      setIsLoadingSystemDevices(false);
    }
  };

  // Handle direct connect from system device
  const handleDirectConnect = async (deviceId: string) => {
    try {
      toast({
        title: "Menghubungkan ke printer",
        description: "Mohon tunggu...",
      });
      
      await connectToSystemDevice(deviceId);
      
      toast({
        title: "Berhasil terhubung",
        description: "Printer berhasil terhubung. Silakan coba print test.",
      });
      
      // Auto print test
      handlePrintTest();
    } catch (error) {
      console.error("Error connecting to system device:", error);
      toast({
        title: "Gagal terhubung",
        description: "Gagal terhubung ke printer. Pastikan printer menyala dan dalam jangkauan.",
        variant: "destructive",
      });
    }
  };

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
        
        // Otomatis load system devices
        loadSystemDevices();
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
      let targetDevice = foundDevices.find(d => {
        const name = (d.name || "").toLowerCase();
        return name.includes('hs6632') || name.includes('hs') || name.includes('6632');
      });
      
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
        description: "Gagal menghubungkan ke printer. Coba lagi atau gunakan menu printer lengkap.",
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

  // Auto-load system devices on component mount
  useEffect(() => {
    if (permissionsGranted) {
      loadSystemDevices();
    }
  }, [permissionsGranted]);

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
        {/* System Bluetooth Devices Section - New! */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium mb-4 text-blue-800 flex items-center gap-2">
            <Bluetooth className="h-4 w-4" />
            Perangkat Bluetooth Sistem
          </h3>
          
          <p className="text-sm text-blue-700 mb-4">
            Pilih printer langsung dari perangkat yang sudah terpasang di sistem Bluetooth Anda:
          </p>
          
          {directConnectError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{directConnectError}</AlertDescription>
            </Alert>
          )}
          
          {isLoadingSystemDevices ? (
            <div className="flex items-center justify-center p-4">
              <Spinner className="h-5 w-5 mr-2" /> 
              <span className="text-blue-700">Memuat perangkat...</span>
            </div>
          ) : systemDevices.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pb-2">
              {systemDevices.map((device) => (
                <div 
                  key={device.id || device.address}
                  className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => handleDirectConnect(device.id || device.address)}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Printer className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{device.name || "Perangkat Tidak Dikenal"}</p>
                      <p className="text-xs text-blue-600">{device.id || device.address}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
                  >
                    Hubungkan
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-blue-800">Tidak ada perangkat Bluetooth yang terpasang.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-xs border-blue-300 text-blue-700"
                onClick={loadSystemDevices}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Muat Ulang
              </Button>
            </div>
          )}
          
          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-blue-300 text-blue-700"
              onClick={loadSystemDevices}
              disabled={isLoadingSystemDevices}
            >
              {isLoadingSystemDevices ? (
                <Spinner className="h-3 w-3 mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Muat Ulang
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Bluetooth Settings
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Bluetooth Settings</SheetTitle>
                  <SheetDescription>
                    Tip: Pasangkan printer HS6632M di pengaturan Bluetooth sistem terlebih dahulu.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <h4 className="text-sm font-medium mb-2">Langkah-langkah:</h4>
                  <ol className="text-sm space-y-2 list-decimal pl-5">
                    <li>Buka pengaturan Bluetooth di perangkat Anda</li>
                    <li>Aktifkan Bluetooth</li>
                    <li>Nyalakan printer HS6632M</li>
                    <li>Tekan tombol pairing pada printer</li>
                    <li>Pilih "HS6632M" dari daftar perangkat</li>
                    <li>Setelah terpasang, kembali ke aplikasi</li>
                    <li>Klik "Muat Ulang" untuk melihat printer</li>
                  </ol>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
          
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
            <li><b>Metode 1:</b> Pasangkan printer di pengaturan Bluetooth sistem terlebih dahulu, lalu pilih dari daftar perangkat di atas</li>
            <li><b>Metode 2:</b> Gunakan tombol <b>"Connect & Print HS6632M"</b> untuk langsung mencari dan terhubung</li>
            <li>Jika gagal, gunakan <b>"Cari & Hubungkan"</b> dan pilih printer secara manual</li>
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
              Jumlah perangkat terdeteksi: {devices.length}, Perangkat sistem: {systemDevices.length}
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
