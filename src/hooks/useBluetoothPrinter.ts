
import { useState, useCallback, useEffect } from 'react';
import { bluetoothPrinter, BluetoothDevice, ReceiptData } from '@/utils/bluetoothPrinter';
import { toast } from '@/hooks/use-toast';

export function useBluetoothPrinter() {
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);

  // Load saved device from localStorage on initial render
  useEffect(() => {
    const savedDevice = localStorage.getItem('bluetooth-printer');
    if (savedDevice) {
      try {
        setSelectedDevice(JSON.parse(savedDevice));
      } catch (e) {
        console.error('Error loading saved printer:', e);
      }
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    try {
      setIsScanning(true);
      const foundDevices = await bluetoothPrinter.scanForDevices();
      setDevices(foundDevices);
      return foundDevices;
    } catch (error: any) {
      console.error('Error scanning for devices:', error);
      toast({
        title: 'Scanning Failed',
        description: error.message || 'Failed to scan for Bluetooth devices',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    try {
      const connectedDevice = await bluetoothPrinter.connectToDevice(deviceId);
      setSelectedDevice(connectedDevice);
      // Save to localStorage for persistence
      localStorage.setItem('bluetooth-printer', JSON.stringify(connectedDevice));
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
      await bluetoothPrinter.printReceipt({ receiptData, copies });
      toast({
        title: 'Receipt Printed',
        description: 'Receipt was successfully sent to the printer',
      });
      return true;
    } catch (error: any) {
      console.error('Error printing receipt:', error);
      toast({
        title: 'Printing Failed',
        description: error.message || 'Failed to print receipt',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  return {
    isScanning,
    isPrinting,
    devices,
    selectedDevice,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
    printReceipt,
  };
}
