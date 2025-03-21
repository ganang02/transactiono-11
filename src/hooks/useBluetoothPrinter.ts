
import { useState, useCallback, useEffect } from 'react';
import { bluetoothPrinter, BluetoothDevice, ReceiptData } from '@/utils/bluetoothPrinter';
import { toast } from '@/hooks/use-toast';

export function useBluetoothPrinter() {
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load saved device from localStorage on initial render
  useEffect(() => {
    const savedDevice = localStorage.getItem('bluetooth-printer');
    if (savedDevice) {
      try {
        const parsedDevice = JSON.parse(savedDevice);
        setSelectedDevice(parsedDevice);
        console.log('Restored saved device from storage:', parsedDevice);
      } catch (e) {
        console.error('Error loading saved printer:', e);
        // Remove invalid data
        localStorage.removeItem('bluetooth-printer');
      }
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    try {
      setIsScanning(true);
      console.log('Starting device scan...');
      let foundDevices = [];
      
      // Try to get any previously paired devices first if available
      try {
        const pairedDevices = await bluetoothPrinter.getPairedDevices();
        if (pairedDevices && pairedDevices.length > 0) {
          console.log('Found paired devices:', pairedDevices);
          foundDevices = [...pairedDevices];
        }
      } catch (err) {
        console.log('No paired devices or not supported:', err);
      }
      
      // Then scan for new devices
      const scannedDevices = await bluetoothPrinter.scanForDevices();
      console.log('Found devices from scan:', scannedDevices);
      
      // Combine and deduplicate devices
      const allDevices = [...foundDevices];
      scannedDevices.forEach(device => {
        if (!allDevices.some(d => d.id === device.id)) {
          allDevices.push(device);
        }
      });
      
      setDevices(allDevices);
      return allDevices;
    } catch (error: any) {
      console.error('Error scanning for devices:', error);
      toast({
        title: 'Scanning Failed',
        description: error.message || 'Failed to scan for Bluetooth devices. Make sure Bluetooth is enabled.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    try {
      setIsConnecting(true);
      console.log('Connecting to device:', deviceId);
      const connectedDevice = await bluetoothPrinter.connectToDevice(deviceId);
      
      // Save to localStorage
      localStorage.setItem('bluetooth-printer', JSON.stringify({
        id: connectedDevice.id,
        name: connectedDevice.name
      }));
      
      setSelectedDevice(connectedDevice);
      toast({
        title: 'Connected',
        description: `Connected to ${connectedDevice.name}`,
      });
      return connectedDevice;
    } catch (error: any) {
      console.error('Error connecting to device:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to the selected device',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectFromDevice = useCallback(async () => {
    try {
      await bluetoothPrinter.disconnectFromDevice();
      setSelectedDevice(null);
      // Remove from localStorage
      localStorage.removeItem('bluetooth-printer');
      toast({
        title: 'Disconnected',
        description: 'Disconnected from printer',
      });
    } catch (error: any) {
      console.error('Error disconnecting from device:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect from the device',
        variant: 'destructive',
      });
    }
  }, []);

  const printReceipt = useCallback(async (receiptData: ReceiptData, copies = 1) => {
    try {
      setIsPrinting(true);
      console.log('Sending print job...');
      
      // First check if we need to reconnect
      if (!bluetoothPrinter.isConnected() && selectedDevice) {
        console.log('Printer not connected, attempting to reconnect...');
        try {
          await bluetoothPrinter.connectToDevice(selectedDevice.id);
        } catch (error) {
          console.error('Error reconnecting to device:', error);
          throw new Error('Printer disconnected. Please reconnect to print.');
        }
      }
      
      // Now try to print
      await bluetoothPrinter.printReceipt({ receiptData, copies });
      console.log('Print job completed');
      toast({
        title: 'Receipt Printed',
        description: 'Receipt was successfully sent to the printer',
      });
      return true;
    } catch (error: any) {
      console.error('Error printing receipt:', error);
      toast({
        title: 'Printing Failed',
        description: error.message || 'Failed to print receipt. Try reconnecting to the printer.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [selectedDevice]);

  return {
    isScanning,
    isPrinting,
    isConnecting,
    devices,
    selectedDevice,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
    printReceipt,
  };
}
