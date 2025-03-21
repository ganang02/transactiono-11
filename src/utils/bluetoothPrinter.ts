
// Type definitions for Bluetooth printer functionality
export interface BluetoothDevice {
  id: string;
  name: string;
  device?: any; // Store the actual browser Bluetooth device
}

export interface PrintOptions {
  copies?: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storeWhatsapp: string;
  transactionId: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  notes?: string;
}

// Bluetooth printer class with ESC/POS commands
class BluetoothPrinter {
  private devices: BluetoothDevice[] = [];
  private connectedDevice: BluetoothDevice | null = null;
  private characteristic: any = null;
  private isDeviceConnected: boolean = false;

  constructor() {
    // Try to restore saved device on initialization
    const savedDevice = localStorage.getItem('bluetooth-printer');
    if (savedDevice) {
      try {
        this.connectedDevice = JSON.parse(savedDevice);
      } catch (e) {
        console.error('Error restoring saved printer:', e);
      }
    }
    
    // Setup disconnection listener if Web Bluetooth is supported
    if (this.isSupported() && typeof navigator !== 'undefined' && navigator.bluetooth) {
      navigator.bluetooth.addEventListener('disconnected', (event: any) => {
        console.log('Bluetooth device disconnected', event);
        this.isDeviceConnected = false;
        this.characteristic = null;
      });
    }
  }

  isSupported(): boolean {
    return (typeof navigator !== 'undefined' && 'bluetooth' in navigator);
  }
  
  isConnected(): boolean {
    return this.isDeviceConnected && this.characteristic !== null;
  }

  async getPairedDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported() || typeof navigator === 'undefined' || !navigator.bluetooth || !navigator.bluetooth.getDevices) {
      throw new Error('getPairedDevices is not supported in this browser/device');
    }
    
    try {
      const devices = await navigator.bluetooth.getDevices();
      return devices.map(device => ({
        id: device.id || Math.random().toString(36).substring(2, 9),
        name: device.name || 'Unknown Printer',
        device: device
      }));
    } catch (error) {
      console.error('Error getting paired devices:', error);
      throw error;
    }
  }

  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth is not supported in this browser');
    }
    
    try {
      console.log('Starting Bluetooth scan...');
      
      // Services that might be used by thermal printers
      const services = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '000018f0-0000-1000-8000-00805f9b34fb',
        '18F0',
        'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2',
        // Generic GATT services that might help
        '1800', // Generic Access
        '1801', // Generic Attribute
        '180A', // Device Information
        // Add as many UUIDs as needed
      ];
      
      let device;
      try {
        // First try with specific service filters
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { services: services },
            // Common names for printers
            { namePrefix: 'Printer' },
            { namePrefix: 'POS' },
            { namePrefix: 'ESC' },
            { namePrefix: 'BT' },
            // Add more common printer name prefixes
          ],
          optionalServices: services
        });
      } catch (err) {
        console.log('Failed with service filters, trying acceptAllDevices:', err);
        // If that fails, try accepting all devices
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: services
        });
      }
      
      console.log('Device found:', device);
      
      // Create a device representation
      const bluetoothDevice: BluetoothDevice = {
        id: device.id || Math.random().toString(36).substring(2, 9),
        name: device.name || 'Unknown Printer',
        device: device
      };
      
      // Store in the list of devices
      this.devices = [bluetoothDevice];
      
      return this.devices;
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId: string): Promise<BluetoothDevice> {
    console.log('Connecting to device:', deviceId);
    
    // Find the device in our list or get it from paired devices
    let device = this.devices.find(d => d.id === deviceId);
    if (!device || !device.device) {
      // Try to get from paired devices if supported
      if (navigator.bluetooth.getDevices) {
        const pairedDevices = await this.getPairedDevices();
        device = pairedDevices.find(d => d.id === deviceId);
      }
      
      // If still not found, it might be a previously saved device that needs reconnection
      if (!device && this.connectedDevice?.id === deviceId) {
        console.log('Device not in device list but matches saved device. Need to scan first.');
        throw new Error('Device not found. Please scan for devices first.');
      } else if (!device) {
        throw new Error('Device not found. Please scan again.');
      }
    }
    
    try {
      console.log('Attempting GATT connection...');
      const server = await device.device.gatt.connect();
      console.log('GATT connected, getting available services...');
      
      // Try different service UUIDs commonly used by thermal printers
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '000018f0-0000-1000-8000-00805f9b34fb',
        '18F0',
        'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2',
        // Try generic services too
        '1800', // Generic Access
        '1801', // Generic Attribute
        '180A', // Device Information
      ];
      
      let service = null;
      for (const uuid of serviceUUIDs) {
        try {
          console.log(`Trying service UUID: ${uuid}`);
          service = await server.getPrimaryService(uuid);
          if (service) {
            console.log(`Found matching service: ${uuid}`);
            break;
          }
        } catch (e) {
          console.log(`Service ${uuid} not found, trying next...`);
        }
      }
      
      if (!service) {
        // If no specific services found, list all services
        console.log('No predefined services found. Listing all available services...');
        try {
          const services = await server.getPrimaryServices();
          console.log('All available services:', services);
          if (services.length > 0) {
            service = services[0]; // Try the first available service
            console.log('Using first available service:', service);
          }
        } catch (e) {
          console.error('Could not list services:', e);
        }
      }
      
      if (!service) {
        throw new Error('No compatible printer service found on this device');
      }
      
      // Try different characteristic UUIDs for writing data
      const characteristicUUIDs = [
        '00002af1-0000-1000-8000-00805f9b34fb',
        '49535343-8841-43f4-a8d4-ecbe34729bb3',
        '0000ff02-0000-1000-8000-00805f9b34fb',
        '00002af1-0000-1000-8000-00805f9b34fb',
        '2AF1',
        'BEF8D6C9-9C21-4C9E-B632-BD58C1009F9F'
      ];
      
      for (const uuid of characteristicUUIDs) {
        try {
          console.log(`Trying characteristic UUID: ${uuid}`);
          this.characteristic = await service.getCharacteristic(uuid);
          if (this.characteristic) {
            console.log(`Found matching characteristic: ${uuid}`);
            break;
          }
        } catch (e) {
          console.log(`Characteristic ${uuid} not found, trying next...`);
        }
      }
      
      if (!this.characteristic) {
        // If no specific characteristic found, try to list all characteristics
        console.log('No predefined characteristics found. Listing all available characteristics...');
        try {
          const characteristics = await service.getCharacteristics();
          console.log('All available characteristics:', characteristics);
          
          // Look for a writable characteristic
          for (const char of characteristics) {
            const properties = char.properties;
            console.log('Characteristic properties:', properties);
            if (properties.write || properties.writeWithoutResponse) {
              this.characteristic = char;
              console.log('Found writable characteristic:', char);
              break;
            }
          }
        } catch (e) {
          console.error('Could not list characteristics:', e);
        }
      }
      
      if (!this.characteristic) {
        throw new Error('No compatible printer characteristic found on this device');
      }
      
      // Store the connected device
      this.connectedDevice = device;
      this.isDeviceConnected = true;
      
      // Save to localStorage for persistence
      localStorage.setItem('bluetooth-printer', JSON.stringify({
        id: device.id,
        name: device.name
      }));
      
      console.log('Successfully connected to printer:', device.name);
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
      this.isDeviceConnected = false;
      this.characteristic = null;
      throw error;
    }
  }

  async disconnectFromDevice(): Promise<void> {
    if (!this.connectedDevice || !this.connectedDevice.device) {
      console.log('No device connected, nothing to disconnect');
      return;
    }
    
    try {
      if (this.connectedDevice.device.gatt.connected) {
        console.log('Disconnecting from device...');
        this.connectedDevice.device.gatt.disconnect();
      }
      
      this.connectedDevice = null;
      this.characteristic = null;
      this.isDeviceConnected = false;
      
      // Remove from localStorage
      localStorage.removeItem('bluetooth-printer');
      console.log('Successfully disconnected from printer');
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw error;
    }
  }

  async printReceipt({ receiptData, copies = 1 }: { receiptData: ReceiptData, copies?: number }): Promise<void> {
    console.log('Printing receipt with data:', receiptData);
    
    if (!this.connectedDevice) {
      throw new Error('No printer connected');
    }
    
    if (!this.characteristic) {
      throw new Error('Printer not properly connected. Please reconnect.');
    }
    
    try {
      // Connect to the device if needed
      if (!this.isDeviceConnected || !this.connectedDevice.device || !this.connectedDevice.device.gatt.connected) {
        console.log('Reconnecting to device before printing...');
        await this.connectToDevice(this.connectedDevice.id);
      }
      
      // Format the receipt
      const receiptContent = this.formatReceiptContent(receiptData);
      
      // Convert text to bytes using ESC/POS commands
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptContent);
      
      // For large data, we need to split into chunks
      const CHUNK_SIZE = 256; // Some devices have a smaller MTU, so use a smaller chunk size
      
      // Print multiple copies if requested
      for (let copy = 0; copy < copies; copy++) {
        console.log(`Printing copy ${copy + 1} of ${copies}`);
        
        // Send data in chunks
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          console.log(`Sending chunk ${i / CHUNK_SIZE + 1}, size: ${chunk.length} bytes`);
          
          // Try different write methods as some printers require specific approaches
          try {
            if (this.characteristic.properties.writeWithoutResponse) {
              await this.characteristic.writeValueWithoutResponse(chunk);
            } else if (this.characteristic.properties.write) {
              await this.characteristic.writeValue(chunk);
            } else {
              // Fallback to generic write method
              await this.characteristic.write(chunk);
            }
          } catch (e) {
            console.error('Error writing to characteristic:', e);
            
            // Try alternative methods
            try {
              // Try a different method
              if (typeof this.characteristic.writeValue === 'function') {
                await this.characteristic.writeValue(chunk);
              } else if (typeof this.characteristic.writeValueWithoutResponse === 'function') {
                await this.characteristic.writeValueWithoutResponse(chunk);
              } else if (typeof this.characteristic.write === 'function') {
                await this.characteristic.write(chunk);
              } else {
                throw new Error('No working write method found');
              }
            } catch (e2) {
              console.error('All write methods failed:', e2);
              throw new Error('Failed to send data to printer. Try reconnecting.');
            }
          }
          
          // Small delay between chunks to avoid overflow
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Add delay between copies
        if (copy < copies - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      console.log('Print job completed successfully');
    } catch (error) {
      console.error('Error printing receipt:', error);
      // Mark as disconnected on error
      this.isDeviceConnected = false;
      throw error;
    }
  }

  private formatReceiptContent(data: ReceiptData): string {
    // Create a nicely formatted receipt with ESC/POS commands
    let receipt = '';
    
    // Initialize printer
    receipt += '\x1B@'; // Initialize printer
    
    // Store header with nice formatting
    receipt += '\x1B\x61\x01'; // Center align
    receipt += '\x1B\x21\x30'; // Double height, double width
    receipt += `${data.storeName}\n`;
    receipt += '\x1B\x21\x00'; // Normal text
    receipt += `${data.storeAddress}\n`;
    receipt += `WhatsApp: ${data.storeWhatsapp}\n\n`;
    
    // Transaction information
    receipt += '\x1B\x61\x00'; // Left align
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += `Transaction: #${data.transactionId}\n`;
    receipt += '\x1B\x45\x00'; // Bold off
    receipt += `Date: ${data.date}\n`;
    receipt += `Payment: ${data.paymentMethod}\n`;
    
    // Divider
    receipt += '--------------------------------\n';
    
    // Header for items
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += 'Item           Qty  Price  Subtotal\n';
    receipt += '\x1B\x45\x00'; // Bold off
    receipt += '--------------------------------\n';
    
    // Items
    data.items.forEach(item => {
      const name = item.name.substring(0, 14).padEnd(14, ' ');
      const qty = item.quantity.toString().padStart(3, ' ');
      const price = this.formatCurrency(item.price).padStart(7, ' ');
      const subtotal = this.formatCurrency(item.subtotal).padStart(9, ' ');
      
      receipt += `${name} ${qty} ${price} ${subtotal}\n`;
    });
    
    receipt += '--------------------------------\n';
    
    // Totals
    receipt += `Subtotal:${' '.repeat(23)}${this.formatCurrency(data.subtotal).padStart(8, ' ')}\n`;
    receipt += `Tax:${' '.repeat(28)}${this.formatCurrency(data.tax).padStart(8, ' ')}\n`;
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += `TOTAL:${' '.repeat(26)}${this.formatCurrency(data.total).padStart(8, ' ')}\n`;
    receipt += '\x1B\x45\x00'; // Bold off
    
    // Payment details for cash transactions
    if (data.paymentMethod.toLowerCase() === 'cash' && data.amountPaid !== undefined) {
      receipt += '--------------------------------\n';
      receipt += `Cash:${' '.repeat(27)}${this.formatCurrency(data.amountPaid).padStart(8, ' ')}\n`;
      if (data.change !== undefined) {
        receipt += `Change:${' '.repeat(25)}${this.formatCurrency(data.change).padStart(8, ' ')}\n`;
      }
    }
    
    // Footer
    receipt += '--------------------------------\n';
    receipt += '\x1B\x61\x01'; // Center align
    receipt += `${data.notes || 'Thank you for your purchase!'}\n`;
    receipt += '\n\n\n\n'; // Feed paper
    receipt += '\x1D\x56\x41\x10'; // Cut paper (partial cut)
    
    return receipt;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinter();
