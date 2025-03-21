
import { useState, useEffect, useCallback } from 'react';
import { BluetoothLeService, bluetoothLeService, BluetoothLeDevice } from '@/utils/bluetoothLeService';
import { BleService, BleCharacteristic } from '@capacitor-community/bluetooth-le';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

export function useBluetoothLE() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothLeDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothLeDevice | null>(null);
  const [services, setServices] = useState<BleService[]>([]);
  const [characteristics, setCharacteristics] = useState<{[serviceId: string]: BleCharacteristic[]}>({}); 
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize Bluetooth LE
  useEffect(() => {
    const initBluetooth = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const initialized = await bluetoothLeService.initialize();
          setIsInitialized(initialized);
          
          if (initialized) {
            const granted = await bluetoothLeService.requestPermissions();
            setPermissionsGranted(granted);
          }
        } else {
          // Web platform
          setIsInitialized(true);
          setPermissionsGranted(true);
        }
      } catch (error) {
        console.error('Failed to initialize Bluetooth LE:', error);
        toast({
          title: 'Bluetooth Error',
          description: 'Failed to initialize Bluetooth. Please check your device settings.',
          variant: 'destructive',
        });
      }
    };

    initBluetooth();
  }, []);

  // Start scanning for devices
  const startScan = useCallback(async () => {
    if (!isInitialized) {
      toast({
        title: 'Bluetooth Error',
        description: 'Bluetooth is not initialized yet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsScanning(true);
      setDevices([]);
      
      // Get paired devices first if available
      const pairedDevices = await bluetoothLeService.getDevices();
      if (pairedDevices.length > 0) {
        setDevices(pairedDevices);
      }
      
      // Start scan for new devices
      await bluetoothLeService.startScan();
      
      // Add listener for new devices
      const scanResultsListener = (event: any) => {
        const newDevice: BluetoothLeDevice = {
          deviceId: event.device.deviceId,
          name: event.device.name || 'Unknown Device',
          rssi: event.rssi,
        };
        
        setDevices(prevDevices => {
          // Check if device already exists
          const exists = prevDevices.some(d => d.deviceId === newDevice.deviceId);
          if (!exists) {
            return [...prevDevices, newDevice];
          }
          return prevDevices;
        });
      };
      
      // TODO: Add actual listener implementation here
      // This will depend on the actual API of the BluetoothLe plugin
      
      // Auto-stop scan after 10 seconds
      setTimeout(() => {
        stopScan();
      }, 10000);
      
    } catch (error) {
      console.error('Error scanning for devices:', error);
      toast({
        title: 'Scan Failed',
        description: 'Failed to scan for Bluetooth devices.',
        variant: 'destructive',
      });
      setIsScanning(false);
    }
  }, [isInitialized]);

  // Stop scanning
  const stopScan = useCallback(async () => {
    if (isScanning) {
      try {
        await bluetoothLeService.stopScan();
      } catch (error) {
        console.error('Error stopping scan:', error);
      } finally {
        setIsScanning(false);
      }
    }
  }, [isScanning]);

  // Connect to a device
  const connectToDevice = useCallback(async (deviceId: string) => {
    try {
      setIsConnecting(true);
      await bluetoothLeService.connectToDevice(deviceId);
      
      // Find the device in our list
      const device = devices.find(d => d.deviceId === deviceId);
      if (device) {
        setConnectedDevice(device);
        
        // Discover services
        const discoveredServices = await bluetoothLeService.discover(deviceId);
        setServices(discoveredServices);
        
        // Get characteristics for each service
        const allCharacteristics: {[serviceId: string]: BleCharacteristic[]} = {};
        
        for (const service of discoveredServices) {
          const serviceCharacteristics = await bluetoothLeService.getCharacteristics(
            deviceId, 
            service.uuid
          );
          allCharacteristics[service.uuid] = serviceCharacteristics;
        }
        
        setCharacteristics(allCharacteristics);
        
        toast({
          title: 'Connected',
          description: `Connected to ${device.name}`,
        });
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to the selected device.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [devices]);

  // Disconnect from device
  const disconnectFromDevice = useCallback(async () => {
    if (connectedDevice) {
      try {
        await bluetoothLeService.disconnectFromDevice(connectedDevice.deviceId);
        setConnectedDevice(null);
        setServices([]);
        setCharacteristics({});
        
        toast({
          title: 'Disconnected',
          description: 'Disconnected from device',
        });
      } catch (error) {
        console.error('Error disconnecting from device:', error);
        toast({
          title: 'Disconnection Failed',
          description: 'Failed to disconnect from the device.',
          variant: 'destructive',
        });
      }
    }
  }, [connectedDevice]);

  // Write data to a characteristic
  const writeToCharacteristic = useCallback(async (
    serviceUUID: string, 
    characteristicUUID: string, 
    data: string
  ) => {
    if (!connectedDevice) {
      toast({
        title: 'Not Connected',
        description: 'No device connected.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await bluetoothLeService.writeToCharacteristic(
        connectedDevice.deviceId,
        serviceUUID,
        characteristicUUID,
        data
      );
      
      toast({
        title: 'Data Sent',
        description: 'Data successfully sent to device.',
      });
    } catch (error) {
      console.error('Error writing to characteristic:', error);
      toast({
        title: 'Write Failed',
        description: 'Failed to send data to device.',
        variant: 'destructive',
      });
    }
  }, [connectedDevice]);

  // Start notifications for a characteristic
  const startNotifications = useCallback(async (
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: any) => void
  ) => {
    if (!connectedDevice) {
      return;
    }
    
    try {
      await bluetoothLeService.startNotifications(
        connectedDevice.deviceId,
        serviceUUID,
        characteristicUUID
      );
      
      // Set up listener
      const removeListener = bluetoothLeService.listenToCharacteristic(
        connectedDevice.deviceId, 
        serviceUUID,
        characteristicUUID,
        callback
      );
      
      return removeListener;
    } catch (error) {
      console.error('Error starting notifications:', error);
      toast({
        title: 'Notification Error',
        description: 'Failed to start notifications from device.',
        variant: 'destructive',
      });
    }
  }, [connectedDevice]);

  // Stop notifications
  const stopNotifications = useCallback(async (
    serviceUUID: string,
    characteristicUUID: string
  ) => {
    if (!connectedDevice) {
      return;
    }
    
    try {
      await bluetoothLeService.stopNotifications(
        connectedDevice.deviceId,
        serviceUUID,
        characteristicUUID
      );
    } catch (error) {
      console.error('Error stopping notifications:', error);
    }
  }, [connectedDevice]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isScanning) {
        bluetoothLeService.stopScan().catch(console.error);
      }
      
      if (connectedDevice) {
        bluetoothLeService.disconnectFromDevice(connectedDevice.deviceId).catch(console.error);
      }
    };
  }, [isScanning, connectedDevice]);

  return {
    isInitialized,
    isScanning,
    permissionsGranted,
    devices,
    connectedDevice,
    services,
    characteristics,
    isConnecting,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    writeToCharacteristic,
    startNotifications,
    stopNotifications,
  };
}
