
// Type definitions for Bluetooth printer functionality
export interface BluetoothDevice {
  id: string;
  name: string;
  gatt: {
    connect: () => Promise<BluetoothRemoteGATTServer>;
  };
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

interface BluetoothRemoteGATTServer {
  getPrimaryService: (service: string) => Promise<BluetoothRemoteGATTService>;
  disconnect: () => void;
}

interface BluetoothRemoteGATTService {
  getCharacteristic: (characteristic: string) => Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue: (value: BufferSource) => Promise<void>;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice: (options: {
      filters?: Array<{ services?: string[], name?: string }>;
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }) => Promise<BluetoothDevice>;
  };
}

// Bluetooth printer functions class
class BluetoothPrinter {
  private activeDevice: BluetoothDevice | null = null;
  private printerServiceUUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private printerCharacteristicUUID = '00002af1-0000-1000-8000-00805f9b34fb';

  isSupported(): boolean {
    return !!(navigator as NavigatorWithBluetooth).bluetooth;
  }

  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth not supported in this browser');
    }
    
    try {
      const device = await (navigator as NavigatorWithBluetooth).bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.printerServiceUUID]
      });
      
      return [{
        id: device.id || Math.random().toString(36).substring(2, 9),
        name: device.name || 'Unknown Printer',
        gatt: device.gatt
      }];
    } catch (error) {
      console.error('Error scanning for devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId: string): Promise<BluetoothDevice> {
    // In a real implementation, we would need to store devices between scans
    // For now, we'll just return the last scanned device if the ID matches
    if (!this.activeDevice || this.activeDevice.id !== deviceId) {
      throw new Error('Device not found. Please scan again.');
    }
    
    try {
      await this.activeDevice.gatt.connect();
      return this.activeDevice;
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  async disconnectFromDevice(): Promise<void> {
    if (!this.activeDevice) {
      return;
    }
    
    try {
      const server = await this.activeDevice.gatt.connect();
      server.disconnect();
      this.activeDevice = null;
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw error;
    }
  }

  async printReceipt({ receiptData, copies = 1 }: { receiptData: ReceiptData, copies?: number }): Promise<void> {
    if (!this.activeDevice) {
      throw new Error('No printer connected');
    }
    
    try {
      const server = await this.activeDevice.gatt.connect();
      const service = await server.getPrimaryService(this.printerServiceUUID);
      const characteristic = await service.getCharacteristic(this.printerCharacteristicUUID);
      
      // Generate receipt content
      const receiptContent = this.formatReceiptContent(receiptData);
      
      // Print multiple copies if requested
      for (let i = 0; i < copies; i++) {
        const encoder = new TextEncoder();
        const data = encoder.encode(receiptContent);
        await characteristic.writeValue(data);
        
        // Add delay between copies
        if (i < copies - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Disconnect after printing
      server.disconnect();
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  private formatReceiptContent(data: ReceiptData): string {
    // Create a nicely formatted receipt with box drawing characters and formatting
    let receipt = '';
    
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
    receipt += '\n\n\n\n\n'; // Feed paper to allow tearing
    
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
