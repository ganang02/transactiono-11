
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SlideUpTransition } from '@/hooks/useTransition';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { X, Bluetooth, Printer, Check, RefreshCw } from 'lucide-react';
import GlassCard from './GlassCard';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterSelected: () => void;
}

const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
  onPrinterSelected,
}) => {
  const {
    isScanning,
    devices,
    selectedDevice,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
  } = useBluetoothPrinter();

  // Auto scan when the modal is opened
  useEffect(() => {
    if (isOpen) {
      scanForDevices();
    }
  }, [isOpen, scanForDevices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <SlideUpTransition show={true}>
        <GlassCard className="w-full max-w-md rounded-xl overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Connect to Printer</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Available printers</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={scanForDevices} 
                disabled={isScanning}
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
                    Refresh
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
                    onClick={() => connectToDevice(device.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-muted-foreground" />
                        <span>{device.name}</span>
                      </div>
                      {selectedDevice?.id === device.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Bluetooth className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">No printers found</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your printer is turned on and in pairing mode
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              {selectedDevice ? (
                <>
                  <p className="text-center text-sm">
                    <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary">
                      Connected to {selectedDevice.name}
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
                    >
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
