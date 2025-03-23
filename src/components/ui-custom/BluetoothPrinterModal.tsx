
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SlideUpTransition } from '@/hooks/useTransition';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { X, Bluetooth, Printer, Check, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceiptPreview from './ReceiptPreview';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import BluetoothSignalStrength from './BluetoothSignalStrength';
import { useBluetoothLE } from '@/hooks/useBluetoothLE';

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
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isOpen) {
      if (isNative) {
        // For native, just check permissions first, but don't auto-scan
        checkBluetoothPermissions();
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
      await scanForDevices();
    } catch (error) {
      console.error('Error scanning for devices:', error);
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
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Printer Settings</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6">
            {isNative && !permissionsGranted && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Bluetooth permissions required</p>
                  <p className="text-xs text-muted-foreground">
                    Please grant Bluetooth and Location permissions in your device settings to use Bluetooth printing.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8 text-xs"
                    onClick={checkBluetoothPermissions}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check Permissions
                  </Button>
                </div>
              </div>
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
                  <p className="text-sm text-muted-foreground">Available printers</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleScan} 
                    disabled={isScanning || (isNative && !permissionsGranted)}
                    className="h-8"
                  >
                    {isScanning ? (
                      <>
                        <Spinner className="mr-2 h-3 w-3" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        {isNative ? "Start Scan" : "Refresh"}
                      </>
                    )}
                  </Button>
                </div>
                
                {isScanning ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <Spinner className="h-8 w-8 mb-2" />
                    <p className="text-sm text-muted-foreground">Scanning for printers...</p>
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
                            <Printer className="h-4 w-4 text-muted-foreground" />
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
                      <p className="font-medium">No printers found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure your printer is turned on and in pairing mode
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        On Android, make sure to grant location and Bluetooth permissions in settings
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Bluetooth className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium">{isNative ? "Click Start Scan to find printers" : "Click Scan to find printers"}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure Bluetooth is enabled on your device
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {showPreview && (
                <TabsContent value="preview">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Receipt Preview</h3>
                    <div className="border rounded-md overflow-hidden">
                      <ReceiptPreview 
                        transaction={previewTransaction}
                        storeInfo={previewStoreInfo}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This is how your receipt will look when printed.
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
                      Connected to {selectedDevice.name || 'Unknown Device'}
                      {!isNative && deviceRSSI[selectedDevice.id] && (
                        <span className="ml-2 text-xs">
                          (Signal: {getSignalQualityText(deviceRSSI[selectedDevice.id])})
                        </span>
                      )}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={disconnectFromDevice}
                    >
                      Disconnect
                    </Button>
                    <Button 
                      onClick={() => {
                        onPrinterSelected();
                        onClose();
                      }}
                      disabled={!selectedDevice}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Select Printer
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Cancel
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
