
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
      const { value } = await BluetoothLe.initialize({
        androidNeverForLocation: false,
      });
      
      console.log('Bluetooth LE initialized:', value);
      return value;
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
      return result.granted === true;
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
      await BluetoothLe.startScan({
        services: [], // Scan for all services
        allowDuplicates: false,
        scanMode: 'lowLatency',
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
      await BluetoothLe.stopScan();
      console.log('Bluetooth LE scan stopped');
    } catch (error) {
      console.error('Error stopping Bluetooth LE scan:', error);
      throw error;
    }
  }

  public async getDevices(): Promise<BluetoothLeDevice[]> {
    try {
      const { devices } = await BluetoothLe.getDevices();
      
      return devices.map(device => ({
        deviceId: device.deviceId,
        name: device.name || 'Unknown Device',
        rssi: device.rssi,
        services: device.services,
        isPaired: true
      }));
    } catch (error) {
      console.error('Error getting connected devices:', error);
      return [];
    }
  }

  public async connectToDevice(deviceId: string): Promise<void> {
    try {
      const { device } = await BluetoothLe.connect({
        deviceId,
        timeout: 10000
      });
      
      this.currentDevice = device;
      this.isConnected = true;
      console.log('Connected to device:', device);
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
      const { services } = await BluetoothLe.discover({
        deviceId,
      });
      
      return services;
    } catch (error) {
      console.error('Error discovering services:', error);
      throw error;
    }
  }

  public async getCharacteristics(deviceId: string, serviceUUID: string): Promise<BleCharacteristic[]> {
    try {
      const { characteristics } = await BluetoothLe.getCharacteristics({
        deviceId,
        service: serviceUUID,
      });
      
      return characteristics;
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
    BluetoothLe.addListener(`${deviceId}:${serviceUUID}:${characteristicUUID}`, callback);
    
    return () => {
      BluetoothLe.removeAllListeners(`${deviceId}:${serviceUUID}:${characteristicUUID}`);
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
}

// Export singleton instance
export const bluetoothLeService = BluetoothLeService.getInstance();
