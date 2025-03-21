import { BluetoothLe, BleDevice, BleService, BleCharacteristic } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

export interface BluetoothLeDevice {
  deviceId: string;
  name: string;
  rssi?: number;
  services?: string[];
  isPaired?: boolean;
}

export class BluetoothLeService {
  private static instance: BluetoothLeService;
  private isConnected: boolean = false;
  private currentDevice: BleDevice | null = null;

  private constructor() {}

  public static getInstance(): BluetoothLeService {
    if (!BluetoothLeService.instance) {
      BluetoothLeService.instance = new BluetoothLeService();
    }
    return BluetoothLeService.instance;
  }

  public isBluetoothSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async initialize(): Promise<boolean> {
    try {
      const result = await BluetoothLe.initialize({
        androidNeverForLocation: false,
      });
      
      console.log('Bluetooth LE initialized:', result);
      return true;
    } catch (error) {
      console.error('Failed to initialize Bluetooth LE:', error);
      throw error;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (!this.isBluetoothSupported()) {
      return false;
    }
    
    try {
      const result = await BluetoothLe.requestLEScan();
      return true; // If no error is thrown, we assume permissions are granted
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      return false;
    }
  }

  public async startScan(): Promise<void> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Bluetooth is not supported in this environment');
    }
    
    try {
      // Use requestLEScan instead of startLEScan and use the correct enum for scanMode
      await BluetoothLe.requestLEScan({
        services: [], // Scan for all services
        allowDuplicates: false,
        // Fix: Use the correct ScanMode enum value, not a string
        scanMode: 1, // 1 corresponds to 'lowLatency' in the plugin
      });
      
      console.log('Bluetooth LE scan started');
    } catch (error) {
      console.error('Error starting Bluetooth LE scan:', error);
      throw error;
    }
  }

  public async stopScan(): Promise<void> {
    if (!this.isBluetoothSupported()) {
      return;
    }
    
    try {
      await BluetoothLe.stopLEScan();
      console.log('Bluetooth LE scan stopped');
    } catch (error) {
      console.error('Error stopping Bluetooth LE scan:', error);
      throw error;
    }
  }

  public async getDevices(): Promise<BluetoothLeDevice[]> {
    try {
      const result = await BluetoothLe.getConnectedDevices({ services: [] });
      
      return result.devices.map(device => ({
        deviceId: device.deviceId,
        name: device.name || 'Unknown Device',
        isPaired: true
      }));
    } catch (error) {
      console.error('Error getting connected devices:', error);
      return [];
    }
  }

  public async connectToDevice(deviceId: string): Promise<void> {
    try {
      await BluetoothLe.connect({
        deviceId,
        timeout: 10000
      });
      
      // Since the connect method doesn't return the device, we create a simple representation
      this.currentDevice = { deviceId, name: 'Connected Device' };
      this.isConnected = true;
      console.log('Connected to device:', deviceId);
    } catch (error) {
      this.isConnected = false;
      this.currentDevice = null;
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  public async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      await BluetoothLe.disconnect({
        deviceId
      });
      
      this.isConnected = false;
      this.currentDevice = null;
      console.log('Disconnected from device:', deviceId);
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw error;
    }
  }

  public async discover(deviceId: string): Promise<BleService[]> {
    try {
      const result = await BluetoothLe.getServices({
        deviceId,
      });
      
      return result.services;
    } catch (error) {
      console.error('Error discovering services:', error);
      throw error;
    }
  }

  public async getCharacteristics(deviceId: string, serviceUUID: string): Promise<BleCharacteristic[]> {
    try {
      // Fix: Use getServices instead of getService, then find the specific service
      const result = await BluetoothLe.getServices({
        deviceId,
      });
      
      // Find the specific service in the returned services array
      const service = result.services.find(s => s.uuid === serviceUUID);
      
      // Return the characteristics of the service if found, otherwise empty array
      return service ? service.characteristics || [] : [];
    } catch (error) {
      console.error('Error getting characteristics:', error);
      throw error;
    }
  }

  public async writeToCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string, value: string): Promise<void> {
    try {
      await BluetoothLe.write({
        deviceId,
        service: serviceUUID,
        characteristic: characteristicUUID,
        value
      });
      
      console.log('Data written successfully');
    } catch (error) {
      console.error('Error writing to characteristic:', error);
      throw error;
    }
  }

  public listenToCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string, callback: (data: any) => void) {
    // First add the listener and save the returned handle
    const listenerPromise = BluetoothLe.addListener('characteristicChanged', callback);
    
    // Return a function that will remove the listener when called
    return async () => {
      // Await and then call remove on the handle
      const handle = await listenerPromise;
      handle.remove();
    };
  }

  public async startNotifications(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<void> {
    try {
      await BluetoothLe.startNotifications({
        deviceId,
        service: serviceUUID,
        characteristic: characteristicUUID,
      });
      
      console.log('Notifications started');
    } catch (error) {
      console.error('Error starting notifications:', error);
      throw error;
    }
  }

  public async stopNotifications(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<void> {
    try {
      await BluetoothLe.stopNotifications({
        deviceId,
        service: serviceUUID,
        characteristic: characteristicUUID,
      });
      
      console.log('Notifications stopped');
    } catch (error) {
      console.error('Error stopping notifications:', error);
      throw error;
    }
  }

  public async readRssi(deviceId: string): Promise<number> {
    try {
      const result = await BluetoothLe.readRssi({
        deviceId
      });
      
      // The readRssi method returns a value object, where the RSSI is in the value property
      console.log(`RSSI for device ${deviceId}: ${result.value}`);
      return result.value;
    } catch (error) {
      console.error('Error reading RSSI:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bluetoothLeService = BluetoothLeService.getInstance();
