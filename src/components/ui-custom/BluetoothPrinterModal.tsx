
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SlideUpTransition } from '@/hooks/useTransition';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { X, Bluetooth, Printer, Check, RefreshCw, Eye, AlertTriangle, Info } from 'lucide-react';
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
  } = useBluetoothPrinter();
  
  const { deviceRSSI } = useBluetoothLE();
  
  const [activeTab, setActiveTab] = useState<string>('connect');
  const [scanAttempted, setScanAttempted] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isOpen) {
      if (isNative) {
        // For native, just check permissions first, but don't auto-scan
        checkBluetoothPermissions();
      }
      setScanError(null);
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
      
      const foundDevices = await scanForDevices();
      
      console.log('Scan complete, devices found:', foundDevices.length);
      
      if (foundDevices.length === 0) {
        setScanError(isNative 
          ? "Tidak ada perangkat ditemukan. Pastikan printer dalam mode pairing dan lokasi diaktifkan."
          : "Tidak ada perangkat ditemukan. Pastikan printer dalam mode pairing dan Bluetooth diaktifkan."
        );
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      setScanError("Gagal memindai: " + (error instanceof Error ? error.message : "Kesalahan tidak diketahui"));
      
      toast({
        title: "Bluetooth scanning failed",
        description: "Make sure Bluetooth is enabled and permissions are granted",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
      onPrinterSelected();
    } catch (error) {
      console.error('Error connecting to device:', error);
      toast({
        title: "Koneksi Gagal",
        description: "Gagal terhubung ke printer. Coba lagi atau pilih printer lain.",
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
                        {isNative ? "Mulai Pemindaian" : "Segarkan"}
                      </>
                    )}
                  </Button>
                </div>
                
                {isScanning ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <Spinner className="h-8 w-8 mb-2" />
                    <p className="text-sm text-muted-foreground">Memindai printer di sekitar...</p>
                  </div>
                ) : devices.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {devices.map((device) => (
                      <div 
                        key={device.id}
                        className={`p-3 rounded-lg border ${
                          selectedDevice?.id === device.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        } cursor-pointer transition-colors`}
                        onClick={() => handleConnect(device.id)}
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
                      <p className="font-medium">{isNative ? "Klik Mulai Pemindaian untuk mencari printer" : "Klik Segarkan untuk mencari printer"}</p>
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
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={disconnectFromDevice}
                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Putuskan
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
                      Pilih Printer
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
