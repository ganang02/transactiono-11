import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SlideUpTransition } from '@/hooks/useTransition';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { X, Bluetooth, Printer, Check, RefreshCw, Eye, AlertTriangle, Info, FileText } from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceiptPreview from './ReceiptPreview';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import BluetoothSignalStrength from './BluetoothSignalStrength';
import { useBluetoothLE } from '@/hooks/useBluetoothLE';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterSelected: () => void;
  previewTransaction?: any;
  previewStoreInfo?: any;
}

const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
  onPrinterSelected,
  previewTransaction,
  previewStoreInfo,
}) => {
  const {
    isScanning,
    devices,
    selectedDevice,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
    isConnecting,
    permissionsGranted,
    checkBluetoothPermissions,
    printReceipt,
    isPrinting
  } = useBluetoothPrinter();
  
  const { deviceRSSI } = useBluetoothLE();
  
  const [activeTab, setActiveTab] = useState<string>('connect');
  const [scanAttempted, setScanAttempted] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [scanTimeout, setScanTimeout] = useState<number>(8000); // Increased from 5000 to 8000 ms
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setScanAttempted(false);
      setScanError(null);
      setRetryCount(0);
      setScanTimeout(8000); // Reset to default 8 seconds
      
      if (isNative) {
        // For native, check permissions first and then auto-scan if permissions are granted
        const checkAndScan = async () => {
          const granted = await checkBluetoothPermissions();
          if (granted) {
            handleScan();
          }
        };
        
        checkAndScan();
      } else {
        // For web, just start scan directly since permissions are handled during scan
        handleScan();
      }
    }
  }, [isOpen, permissionsGranted]);

  useEffect(() => {
    if (previewTransaction && previewStoreInfo) {
      setActiveTab('preview');
    }
  }, [previewTransaction, previewStoreInfo]);

  const handleScan = async () => {
    try {
      setScanAttempted(true);
      setScanError(null);
      
      // Log current state
      console.log('Starting scan with permissions:', permissionsGranted);
      console.log('Platform:', isNative ? 'Native' : 'Web');
      console.log('Retry count:', retryCount);
      console.log('Scan timeout:', scanTimeout);
      
      // If this is a retry, use a longer timeout
      const adjustedTimeout = retryCount > 0 ? scanTimeout + (retryCount * 2000) : scanTimeout;
      console.log('Using adjusted timeout:', adjustedTimeout);
      
      // Show toast on scan start
      toast({
        title: "Memindai printer",
        description: `Sedang mencari printer Bluetooth di sekitar (${adjustedTimeout/1000}s)...`,
      });
      
      // Start scan with timeout
      const scanPromise = scanForDevices();
      
      // Set timeout for scan
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Scan timeout - no devices found")), adjustedTimeout);
      });
      
      // Race between scan and timeout
      const foundDevices = await Promise.race([scanPromise, timeoutPromise]);
      
      // Safely check if foundDevices is an array and has length property
      const devicesArray = Array.isArray(foundDevices) ? foundDevices : [];
      console.log('Scan complete, devices found:', devicesArray.length);
      
      if (devicesArray.length === 0) {
        // Try auto-retry if no devices found
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setScanTimeout(prev => prev + 3000); // Increase timeout more aggressively
          
          toast({
            title: "Mencoba lagi",
            description: "Tidak ada printer ditemukan. Mencoba pemindaian lagi dengan waktu lebih lama...",
          });
          
          // Short delay before retry
          setTimeout(() => {
            handleScan();
          }, 1000);
          return;
        }
        
        setScanError(isNative 
          ? "Tidak ada perangkat ditemukan. Pastikan printer dalam mode pairing dan lokasi diaktifkan."
          : "Tidak ada perangkat ditemukan. Pastikan printer dalam mode pairing dan Bluetooth diaktifkan."
        );
        
        toast({
          title: "Pemindaian selesai",
          description: "Tidak ada printer ditemukan. Coba tekan tombol pairing di printer (FEED selama 3 detik).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Printer ditemukan",
          description: `Ditemukan ${devicesArray.length} perangkat printer`,
        });
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      
      // Try to determine the specific error
      let errorMessage = "Kesalahan tidak diketahui";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common Bluetooth errors
        if (errorMessage.includes("Bluetooth adapter not available")) {
          errorMessage = "Bluetooth tidak tersedia atau tidak diaktifkan";
        } else if (errorMessage.includes("User cancelled")) {
          errorMessage = "Pemindaian dibatalkan oleh pengguna";
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "Waktu pemindaian habis. Coba lagi atau restart printer.";
        }
      }
      
      setScanError("Gagal memindai: " + errorMessage);
      
      toast({
        title: "Pemindaian gagal",
        description: "Pastikan Bluetooth aktif dan printer dalam jangkauan",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      toast({
        title: "Menghubungkan",
        description: "Menghubungkan ke printer. Mohon tunggu...",
      });
      
      await connectToDevice(deviceId);
      
      toast({
        title: "Terhubung",
        description: "Printer berhasil terhubung",
      });
      
      onPrinterSelected();
    } catch (error) {
      console.error('Error connecting to device:', error);
      
      // Try to get specific error message
      let errorMessage = "Gagal terhubung ke printer";
      if (error instanceof Error) {
        if (error.message.includes("GATT operation failed")) {
          errorMessage = "Koneksi GATT gagal. Pastikan printer menyala dan siap.";
        } else if (error.message.includes("service")) {
          errorMessage = "Layanan printer tidak ditemukan. Mungkin bukan printer thermal.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Koneksi Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const handlePrintTest = async () => {
    if (!selectedDevice) {
      toast({
        title: "Tidak Ada Printer",
        description: "Silakan pilih printer terlebih dahulu",
        variant: "destructive"
      });
      return;
    }
    
    try {
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
      
      toast({
        title: "Mengirim data ke printer",
        description: "Mohon tunggu...",
      });
      
      await printReceipt(testReceiptData);
      
      toast({
        title: "Test Print",
        description: "Struk test berhasil dikirim ke printer",
      });
    } catch (error) {
      console.error("Error printing test receipt:", error);
      
      let errorMessage = "Terjadi kesalahan saat mencetak";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Gagal Mencetak",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const showPreview = previewTransaction && previewStoreInfo;

  if (!isOpen) return null;

  const getSignalQualityText = (rssi?: number) => {
    if (rssi === undefined) return 'Unknown';
    if (rssi > -60) return 'Excellent';
    if (rssi > -70) return 'Good';
    if (rssi > -80) return 'Fair';
    if (rssi > -90) return 'Poor';
    return 'Very poor';
  };

  // Helper function to check if device is likely a printer
  const isProbablyPrinter = (device: any) => {
    if (!device.name) return true; // If no name, default to showing it
    
    const name = device.name.toLowerCase();
    return (
      name.includes('print') || 
      name.includes('hs') || 
      name.includes('6632') ||
      name.includes('thermal') || 
      name.includes('epson') ||
      name.includes('pos') ||
      name.includes('bt') ||
      name.includes('escpos')
    );
  };

  // Filter devices to only show potential printers - show ALL devices during troubleshooting
  const filteredDevices = devices; // Show all devices to help troubleshoot

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <SlideUpTransition show={true}>
        <GlassCard className="w-full max-w-md rounded-xl overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-1.5 rounded-full">
                <Bluetooth className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-medium">Pengaturan Printer</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6">
            {isNative && !permissionsGranted && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <AlertTitle>Izin Bluetooth diperlukan</AlertTitle>
                <AlertDescription>
                  Mohon berikan izin Bluetooth dan Lokasi untuk menggunakan fitur cetak.
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8 text-xs w-full"
                    onClick={checkBluetoothPermissions}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Periksa Izin
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="connect" className="flex items-center gap-1">
                  <Bluetooth className="h-4 w-4" />
                  Connect
                </TabsTrigger>
                {showPreview && (
                  <TabsTrigger value="preview" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="connect">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">Printer tersedia</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleScan} 
                    disabled={isScanning || (isNative && !permissionsGranted)}
                    className="h-8 bg-primary/5 hover:bg-primary/10"
                  >
                    {isScanning ? (
                      <>
                        <Spinner className="mr-2 h-3 w-3" />
                        Memindai...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Segarkan
                      </>
                    )}
                  </Button>
                </div>
                
                {isScanning ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <Spinner className="h-8 w-8 mb-2" />
                    <p className="text-sm text-muted-foreground">Memindai printer di sekitar...</p>
                    <p className="text-xs text-muted-foreground mt-1">Mohon tunggu {scanTimeout/1000} detik</p>
                  </div>
                ) : filteredDevices.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {filteredDevices.map((device) => (
                      <div 
                        key={device.id}
                        className={`p-3 rounded-lg border ${
                          selectedDevice?.id === device.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        } cursor-pointer transition-colors`}
                        onClick={() => connectToDevice(device.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${selectedDevice?.id === device.id ? 'bg-primary/20' : 'bg-muted'}`}>
                              <Printer className={`h-4 w-4 ${selectedDevice?.id === device.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <span>{device.name || 'Unknown Device'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isNative && deviceRSSI[device.id] && (
                              <BluetoothSignalStrength 
                                rssi={deviceRSSI[device.id]} 
                              />
                            )}
                            {isConnecting && selectedDevice?.id === device.id ? (
                              <Spinner className="h-3 w-3 text-primary" />
                            ) : selectedDevice?.id === device.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : scanAttempted ? (
                  <div className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Bluetooth className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium">Tidak ada printer ditemukan</p>
                      
                      {scanError && (
                        <Alert variant="destructive" className="mt-4 text-left">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Pemindaian Gagal</AlertTitle>
                          <AlertDescription className="text-xs">
                            {scanError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="mt-4 space-y-2 text-left bg-blue-50 p-3 rounded-lg border border-blue-100 w-full">
                        <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Cara menyelesaikan masalah:
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                          <li>Pastikan printer Bluetooth menyala dan dalam mode pairing</li>
                          <li>Tekan tombol pairing pada printer (biasanya tombol FEED/PAPER selama 3 detik)</li>
                          <li>Aktifkan Bluetooth di perangkat Anda</li>
                          {isNative && <li>Aktifkan Lokasi di perangkat Anda (diperlukan Android)</li>}
                          <li>Coba matikan dan nyalakan kembali printer</li>
                          <li>Restart aplikasi dan coba lagi</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Bluetooth className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium">Klik Segarkan untuk mencari printer</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Pastikan Bluetooth diaktifkan di perangkat Anda
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {showPreview && (
                <TabsContent value="preview">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Pratinjau Struk</h3>
                    <div className="border rounded-md overflow-hidden">
                      <ReceiptPreview 
                        transaction={previewTransaction}
                        storeInfo={previewStoreInfo}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tampilan struk yang akan dicetak.
                    </p>
                  </div>
                </TabsContent>
              )}
            </Tabs>
            
            <div className="mt-6 space-y-3">
              {selectedDevice ? (
                <>
                  <p className="text-center text-sm">
                    <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary">
                      Terhubung ke {selectedDevice.name || 'Unknown Device'}
                      {!isNative && deviceRSSI[selectedDevice.id] && (
                        <span className="ml-2 text-xs">
                          (Sinyal: {getSignalQualityText(deviceRSSI[selectedDevice.id])})
                        </span>
                      )}
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={disconnectFromDevice}
                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Putuskan
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handlePrintTest}
                      disabled={isPrinting}
                      className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {isPrinting ? (
                        <Spinner className="h-3 w-3 mr-2" />
                      ) : (
                        <FileText className="h-3 w-3 mr-2" />
                      )}
                      Test Print
                    </Button>
                    <Button 
                      onClick={() => {
                        onPrinterSelected();
                        onClose();
                      }}
                      disabled={!selectedDevice}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Pilih
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      </SlideUpTransition>
    </div>
  );
};

export default BluetoothPrinterModal;
