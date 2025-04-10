
import { useState, useCallback, useEffect } from 'react';
import { bluetoothPrinter, BluetoothDevice, ReceiptData } from '@/utils/bluetoothPrinter';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BluetoothLe, ScanResult, BleDevice } from '@capacitor-community/bluetooth-le';

export function useBluetoothPrinter() {
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

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
    
    // Check permissions on native platforms
    if (Capacitor.isNativePlatform()) {
      checkBluetoothPermissions();
    } else {
      setPermissionsGranted(true); // On web, handled differently
    }
  }, []);

  // Function to check Bluetooth permissions on native platforms
  const checkBluetoothPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermissionsGranted(true);
      return true;
    }

    try {
      // Initialize BLE
      await BluetoothLe.initialize({
        androidNeverForLocation: false,
      });
      
      // Request scan permission which will prompt for necessary permissions
      const result = await BluetoothLe.requestLEScan({
        services: [],
        scanMode: 1, // Low latency scan mode
        allowDuplicates: false,
      });
      
      // If we got here without errors, permissions are granted
      setPermissionsGranted(true);
      console.log('Bluetooth permissions are granted');
      
      // Make sure to stop the scan we just started
      await BluetoothLe.stopLEScan();
      
      return true;
    } catch (error) {
      console.error('Error checking bluetooth permissions:', error);
      setPermissionsGranted(false);
      return false;
    }
  };

  const scanForDevices = useCallback(async () => {
    let nativeDevices: BluetoothDevice[] = [];
    let webDevices: BluetoothDevice[] = [];
    
    try {
      setIsScanning(true);
      setDevices([]); // Clear previous devices
      console.log('Starting device scan...');
      
      // Different approach based on platform
      if (Capacitor.isNativePlatform()) {
        // For native apps, use the Capacitor plugin
        if (!permissionsGranted) {
          const granted = await checkBluetoothPermissions();
          if (!granted) {
            toast({
              title: 'Permission Required',
              description: 'Bluetooth permission is required to scan for devices.',
              variant: 'destructive',
            });
            return [];
          }
        }
        
        // Start a scan
        try {
          console.log('Starting native BLE scan');
          
          // Start scan
          await BluetoothLe.requestLEScan({
            services: [],
            scanMode: 1, // Low latency
            allowDuplicates: false
          });
          
          // Fix: Using "onScanResult" as the correct event name instead of "scanResult"
          const listener = await BluetoothLe.addListener('onScanResult', (result: any) => {
            console.log('Scan result received:', result);
            // We need to check what properties are actually available in the result
            if (result && result.device && result.device.deviceId) {
              const newDevice: BluetoothDevice = {
                id: result.device.deviceId,
                name: result.device.name || 'Unknown Device'
              };
              
              // Update devices state (avoiding duplicates)
              setDevices(currentDevices => {
                if (!currentDevices.some(d => d.id === newDevice.id)) {
                  return [...currentDevices, newDevice];
                }
                return currentDevices;
              });
            }
          });
          
          // Wait for a few seconds to collect results
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Clean up the scan
          await BluetoothLe.stopLEScan();
          listener.remove();
          
          console.log('Native scan completed');
        } catch (error) {
          console.error('Error during native BLE scan:', error);
        }
        
        // Also try to get paired devices if available
        try {
          console.log('Getting connected devices');
          const result = await BluetoothLe.getConnectedDevices({ services: [] });
          
          if (result && result.devices) {
            const connectedDevices = result.devices.map(device => ({
              id: device.deviceId,
              name: device.name || 'Unknown Device',
            }));
            
            console.log('Connected devices:', connectedDevices);
            
            // Add to devices without duplicates
            nativeDevices = connectedDevices;
          }
        } catch (err) {
          console.log('Error getting connected devices:', err);
        }
      } else {
        // For web, use the Web Bluetooth API via our wrapper
        try {
          console.log('Starting web bluetooth scan');
          // Try to get any previously paired devices first
          try {
            const pairedDevices = await bluetoothPrinter.getPairedDevices();
            if (pairedDevices && pairedDevices.length > 0) {
              console.log('Found paired devices:', pairedDevices);
              webDevices = [...pairedDevices];
            }
          } catch (err) {
            console.log('No paired devices or not supported:', err);
          }
          
          // Then scan for new devices
          const scannedDevices = await bluetoothPrinter.scanForDevices();
          console.log('Found devices from scan:', scannedDevices);
          
          // Add scanned devices without duplicates
          scannedDevices.forEach(device => {
            if (!webDevices.some(d => d.id === device.id)) {
              webDevices.push(device);
            }
          });
        } catch (error) {
          console.error('Error during web bluetooth scan:', error);
        }
      }
      
      // Combine devices from both sources without duplicates
      const allDevices = [...nativeDevices];
      webDevices.forEach(device => {
        if (!allDevices.some(d => d.id === device.id)) {
          allDevices.push(device);
        }
      });
      
      console.log('Final device list:', allDevices);
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
  }, [permissionsGranted]);

  const connectToDevice = useCallback(async (deviceId: string) => {
    try {
      setIsConnecting(true);
      console.log('Connecting to device:', deviceId);
      
      let connectedDevice;
      
      if (Capacitor.isNativePlatform()) {
        // Connect using Capacitor plugin
        try {
          await BluetoothLe.connect({
            deviceId,
            timeout: 10000
          });
          
          // Find the device in our list to get its name
          const device = devices.find(d => d.id === deviceId);
          
          connectedDevice = {
            id: deviceId,
            name: device?.name || 'Connected Device'
          };
        } catch (error) {
          console.error('Error connecting with native BLE:', error);
          throw error;
        }
      } else {
        // Connect using Web Bluetooth
        connectedDevice = await bluetoothPrinter.connectToDevice(deviceId);
      }
      
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
  }, [devices]);

  const disconnectFromDevice = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform() && selectedDevice) {
        // Disconnect using Capacitor plugin
        try {
          await BluetoothLe.disconnect({
            deviceId: selectedDevice.id
          });
        } catch (error) {
          console.error('Error disconnecting with native BLE:', error);
        }
      } else {
        // Disconnect using Web Bluetooth
        await bluetoothPrinter.disconnectFromDevice();
      }
      
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
  }, [selectedDevice]);

  const printReceipt = useCallback(async (receiptData: ReceiptData, copies = 1) => {
    try {
      setIsPrinting(true);
      console.log('Sending print job...');
      
      if (Capacitor.isNativePlatform()) {
        // Print using native BLE
        // This would require a more complex implementation to send ESC/POS commands
        // over BLE characteristic writes
        toast({
          title: 'Native Printing',
          description: 'Native BLE printing is not yet implemented',
          variant: 'destructive',
        });
        return false;
      } else {
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
      }
      
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
    permissionsGranted,
    scanForDevices,
    connectToDevice,
    disconnectFromDevice,
    printReceipt,
    checkBluetoothPermissions,
  };
}
