
import { useState, useCallback, useEffect } from 'react';
import { bluetoothPrinter, BluetoothDevice, ReceiptData } from '@/utils/bluetoothPrinter';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BluetoothLe, BleDevice } from '@capacitor-community/bluetooth-le';

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
      
      // Check if Bluetooth is enabled
      const bleEnabled = await BluetoothLe.isEnabled();
      if (!bleEnabled.value) {
        try {
          // Try to enable Bluetooth
          await BluetoothLe.openBluetoothSettings();
          toast({
            title: "Bluetooth Tidak Aktif",
            description: "Mohon aktifkan Bluetooth di pengaturan perangkat",
            variant: "destructive",
          });
          return false;
        } catch (error) {
          console.error('Error opening Bluetooth settings:', error);
          return false;
        }
      }
      
      // Request scan permission which will prompt for necessary permissions
      try {
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
        // This is likely a permission error
        console.error('Error requesting BLE scan:', error);
        setPermissionsGranted(false);
        
        // Try to open location settings if we're on Android
        if (Capacitor.getPlatform() === 'android') {
          try {
            await BluetoothLe.openLocationSettings();
            toast({
              title: "Lokasi Diperlukan",
              description: "Mohon aktifkan Lokasi untuk menggunakan Bluetooth di Android",
              variant: "destructive",
            });
          } catch (e) {
            console.error('Error opening location settings:', e);
          }
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error checking bluetooth permissions:', error);
      setPermissionsGranted(false);
      return false;
    }
  };

  // NEW: Get System Bluetooth devices (directly from system settings)
  const getSystemBluetoothDevices = useCallback(async () => {
    console.log("Getting system Bluetooth devices");
    if (Capacitor.isNativePlatform()) {
      try {
        if (!permissionsGranted) {
          const granted = await checkBluetoothPermissions();
          if (!granted) {
            throw new Error("Bluetooth permissions not granted");
          }
        }
        
        // Try to get paired devices if available
        try {
          const result = await BluetoothLe.getConnectedDevices({ services: [] });
          console.log("Connected devices from system:", result);
          
          if (result && result.devices) {
            return result.devices.map(device => ({
              id: device.deviceId,
              name: device.name || 'Unknown Device',
              address: device.deviceId
            }));
          }
          return [];
        } catch (err) {
          console.error('Error getting connected devices:', err);
          
          // On Android, try alternative method
          if (Capacitor.getPlatform() === 'android') {
            try {
              // Attempt to open Bluetooth settings to let user pair
              await BluetoothLe.openBluetoothSettings();
              toast({
                title: "Pairing Diperlukan",
                description: "Harap pasangkan printer di pengaturan Bluetooth",
              });
            } catch (e) {
              console.error("Could not open Bluetooth settings:", e);
            }
          }
          
          return [];
        }
      } catch (error) {
        console.error("Error getting system Bluetooth devices:", error);
        throw error;
      }
    } else {
      // For web, use the Web Bluetooth API
      try {
        if ('bluetooth' in navigator && 'getDevices' in navigator.bluetooth) {
          const devices = await navigator.bluetooth.getDevices();
          console.log("Web Bluetooth paired devices:", devices);
          return devices.map(device => ({
            id: device.id,
            name: device.name || 'Unknown Device',
            device
          }));
        } else {
          console.log("getDevices not supported in this browser");
          return [];
        }
      } catch (error) {
        console.error("Error getting web Bluetooth devices:", error);
        return [];
      }
    }
  }, [permissionsGranted]);

  // NEW: Connect to a system paired device by ID
  const connectToSystemDevice = useCallback(async (deviceId: string) => {
    console.log("Connecting to system device:", deviceId);
    setIsConnecting(true);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // For native platforms
        try {
          await BluetoothLe.connect({
            deviceId,
            timeout: 10000
          });
          
          // Create a device object
          const connectedDevice = {
            id: deviceId,
            name: "System Printer" // We might not have the name
          };
          
          // Try to get the name from our devices list
          const systemDevices = await getSystemBluetoothDevices();
          // Fix: Safely check for address property
          const matchedDevice = systemDevices.find(d => {
            if (d.id === deviceId) return true;
            if ('address' in d && d.address === deviceId) return true;
            return false;
          });
          
          if (matchedDevice) {
            connectedDevice.name = matchedDevice.name;
          }
          
          // Save device
          localStorage.setItem('bluetooth-printer', JSON.stringify(connectedDevice));
          setSelectedDevice(connectedDevice);
          
          return connectedDevice;
        } catch (error) {
          console.error("Error connecting to system device:", error);
          throw error;
        }
      } else {
        // For web browsers
        try {
          // Try to find device in paired devices
          let targetDevice;
          if ('bluetooth' in navigator && 'getDevices' in navigator.bluetooth) {
            const pairedDevices = await navigator.bluetooth.getDevices();
            targetDevice = pairedDevices.find(d => d.id === deviceId);
          }
          
          if (!targetDevice) {
            // If not found, it might be a previously saved device that needs reconnection
            return await connectToDevice(deviceId);
          }
          
          // Use the utility to connect to this device
          const result = await bluetoothPrinter.connectToSystemDevice(targetDevice);
          
          const connectedDevice = {
            id: targetDevice.id,
            name: targetDevice.name || "Web Printer"
          };
          
          // Save device
          localStorage.setItem('bluetooth-printer', JSON.stringify(connectedDevice));
          setSelectedDevice(connectedDevice);
          
          return connectedDevice;
        } catch (error) {
          console.error("Error connecting to web system device:", error);
          throw error;
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

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
          
          // First, try to get any existing paired devices
          const systemDevices = await getSystemBluetoothDevices();
          if (systemDevices.length > 0) {
            nativeDevices = systemDevices;
          }
          
          // Start scan for new devices
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
              
              // Also update nativeDevices for final return
              if (!nativeDevices.some(d => d.id === newDevice.id)) {
                nativeDevices.push(newDevice);
              }
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
    console.log('Starting print receipt with data:', receiptData);
    try {
      setIsPrinting(true);
      
      if (!selectedDevice) {
        throw new Error('Tidak ada printer yang terhubung');
      }
      
      console.log('Sending print job to device:', selectedDevice);
      
      if (Capacitor.isNativePlatform()) {
        // Print using native BLE
        // For now, we'll show a toast until native printing is implemented
        toast({
          title: 'Native Printing',
          description: 'Mencoba mencetak via Native BLE...',
          variant: 'default',
        });
        
        // Here we would implement the native print code
        // For now we'll throw an informative error
        throw new Error('Printing via Native BLE belum diimplementasikan sepenuhnya. Silakan gunakan web versi.');
      } else {
        // First check if we need to reconnect
        if (!bluetoothPrinter.isConnected() && selectedDevice) {
          console.log('Printer not connected, attempting to reconnect...');
          
          // Show reconnect toast
          toast({
            title: 'Reconnecting Printer',
            description: 'Mencoba menghubungkan kembali ke printer...',
          });
          
          try {
            await bluetoothPrinter.connectToDevice(selectedDevice.id);
            toast({
              title: 'Printer Connected',
              description: 'Printer berhasil terhubung kembali',
            });
          } catch (error) {
            console.error('Error reconnecting to device:', error);
            throw new Error('Printer terputus. Silakan hubungkan kembali untuk mencetak.');
          }
        }
        
        // Now try to print
        console.log('Sending data to printer...');
        await bluetoothPrinter.printReceipt({ receiptData, copies });
      }
      
      console.log('Print job completed successfully');
      toast({
        title: 'Struk Tercetak',
        description: 'Struk berhasil dikirim ke printer',
      });
      return true;
    } catch (error: any) {
      console.error('Error printing receipt:', error);
      toast({
        title: 'Gagal Mencetak',
        description: error.message || 'Gagal mencetak struk. Coba hubungkan kembali printer.',
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
    getSystemBluetoothDevices,
    connectToSystemDevice
  };
}
