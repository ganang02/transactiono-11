
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
  }

  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth is not supported in this browser');
    }
    
    try {
      console.log('Starting Bluetooth scan...');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        // Commonly used service UUIDs for thermal printers
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '18F0',
          'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2'
        ]
      });
      
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
    
    // Find the device in our list
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || !device.device) {
      throw new Error('Device not found. Please scan again.');
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
        '18F0',
        'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2'
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
        throw new Error('No compatible printer service found on this device');
      }
      
      // Try different characteristic UUIDs for writing data
      const characteristicUUIDs = [
        '00002af1-0000-1000-8000-00805f9b34fb',
        '49535343-8841-43f4-a8d4-ecbe34729bb3',
        '0000ff02-0000-1000-8000-00805f9b34fb',
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
        throw new Error('No compatible printer characteristic found on this device');
      }
      
      // Store the connected device
      this.connectedDevice = device;
      
      // Save to localStorage for persistence
      localStorage.setItem('bluetooth-printer', JSON.stringify({
        id: device.id,
        name: device.name
      }));
      
      console.log('Successfully connected to printer:', device.name);
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
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
      if (!this.connectedDevice.device || !this.connectedDevice.device.gatt.connected) {
        console.log('Reconnecting to device before printing...');
        await this.connectToDevice(this.connectedDevice.id);
      }
      
      // Format the receipt
      const receiptContent = this.formatReceiptContent(receiptData);
      
      // Convert text to bytes using ESC/POS commands
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptContent);
      
      // For large data, we need to split into chunks
      const CHUNK_SIZE = 512; // Most BLE devices have a limit of around 512 bytes
      
      // Print multiple copies if requested
      for (let copy = 0; copy < copies; copy++) {
        console.log(`Printing copy ${copy + 1} of ${copies}`);
        
        // Send data in chunks
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          console.log(`Sending chunk ${i / CHUNK_SIZE + 1}, size: ${chunk.length} bytes`);
          
          // Try different write methods as some printers require specific approaches
          try {
            await this.characteristic.writeValue(chunk);
          } catch (e) {
            console.error('Error with writeValue, trying writeValueWithoutResponse:', e);
            try {
              await this.characteristic.writeValueWithoutResponse(chunk);
            } catch (e2) {
              console.error('Error with writeValueWithoutResponse, trying write:', e2);
              await this.characteristic.write(chunk);
            }
          }
          
          // Small delay between chunks to avoid overflow
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Add delay between copies
        if (copy < copies - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('Print job completed successfully');
    } catch (error) {
      console.error('Error printing receipt:', error);
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
