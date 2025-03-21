
// Bluetooth Printer Utility
// This utility provides functions to interact with Bluetooth printers

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  device?: any; // Web Bluetooth device
}

export interface PrintOptions {
  receiptData: ReceiptData;
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

class BluetoothPrinterService {
  private availableDevices: BluetoothDevice[] = [];
  private selectedDevice: BluetoothDevice | null = null;
  private isScanning = false;

  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
      return this.availableDevices;
    }

    this.isScanning = true;
    console.log('Scanning for Bluetooth devices...');
    
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in your browser');
      }
      
      // Request device with print service
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common printer service
          { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] }, // ESC/POS service
          { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }, // Thermal printer service
        ],
        optionalServices: ['battery_service'],
        acceptAllDevices: true // Fallback to show all devices
      });
      
      console.log('Device selected:', device);
      
      // Create BluetoothDevice object
      const bluetoothDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: false,
        device: device
      };
      
      // Add to available devices if not already present
      if (!this.availableDevices.some(d => d.id === bluetoothDevice.id)) {
        this.availableDevices.push(bluetoothDevice);
      }
      
      console.log('Found devices:', this.availableDevices);
      return this.availableDevices;
    } catch (error) {
      console.error('Error scanning for devices:', error);
      // If user cancels the request, don't throw error
      if (error.name === 'NotFoundError' || error.message.includes('User cancelled')) {
        return this.availableDevices;
      }
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  async connectToDevice(deviceId: string): Promise<BluetoothDevice> {
    console.log(`Connecting to device with ID: ${deviceId}`);
    
    const device = this.availableDevices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }
    
    try {
      if (!device.device || !device.device.gatt) {
        throw new Error('Invalid device object');
      }
      
      // Connect to the device
      const server = await device.device.gatt.connect();
      console.log('Connected to GATT server:', server);
      
      // Update device status
      device.connected = true;
      this.selectedDevice = device;
      
      console.log('Connected to device:', device.name);
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  async disconnectFromDevice(): Promise<void> {
    if (!this.selectedDevice || !this.selectedDevice.device) {
      console.log('No device connected');
      return;
    }
    
    console.log(`Disconnecting from device: ${this.selectedDevice.name}`);
    
    try {
      if (this.selectedDevice.device.gatt.connected) {
        this.selectedDevice.device.gatt.disconnect();
      }
      
      this.selectedDevice.connected = false;
      this.selectedDevice = null;
      
      console.log('Disconnected from device');
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw error;
    }
  }

  async printReceipt(options: PrintOptions): Promise<boolean> {
    if (!this.selectedDevice || !this.selectedDevice.device) {
      throw new Error('No printer connected');
    }
    
    const { receiptData, copies = 1 } = options;
    
    console.log(`Printing receipt to ${this.selectedDevice.name}`);
    console.log('Receipt data:', receiptData);
    
    try {
      // Get formatted receipt
      const receiptText = this.formatReceiptData(receiptData);
      
      // Connect to the device if not connected
      if (!this.selectedDevice.device.gatt.connected) {
        await this.connectToDevice(this.selectedDevice.id);
      }
      
      // Access printer service
      const server = await this.selectedDevice.device.gatt.connect();
      
      // Note: The exact service and characteristic UUIDs will depend on your printer
      // These are example UUIDs that might need to be adjusted
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
        .catch(() => server.getPrimaryService('e7810a71-73ae-499d-8c15-faa9aef0c3f2'))
        .catch(() => server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455'))
        .catch(() => {
          // If no printer service is found, try to get any available service
          return server.getPrimaryServices().then(services => {
            if (services.length === 0) throw new Error('No services found on the device');
            return services[0];
          });
        });
      
      console.log('Got printer service:', service);
      
      // Get printer characteristic
      const characteristics = await service.getCharacteristics();
      console.log('Available characteristics:', characteristics);
      
      if (characteristics.length === 0) {
        throw new Error('No characteristics found for the printer service');
      }
      
      // Find a writable characteristic
      const writeCharacteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
      
      if (!writeCharacteristic) {
        throw new Error('No writable characteristic found');
      }
      
      console.log('Using characteristic:', writeCharacteristic);
      
      // Convert the text to bytes and print
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptText);
      
      // Split the data into chunks (Bluetooth has max packet size)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await writeCharacteristic.writeValue(chunk);
      }
      
      // Print multiple copies if needed
      if (copies > 1) {
        for (let i = 1; i < copies; i++) {
          // Send form feed to start new page
          await writeCharacteristic.writeValue(encoder.encode('\f'));
          
          // Print the receipt again
          for (let j = 0; j < data.length; j += chunkSize) {
            const chunk = data.slice(j, j + chunkSize);
            await writeCharacteristic.writeValue(chunk);
          }
        }
      }
      
      console.log('Receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  getSelectedDevice(): BluetoothDevice | null {
    return this.selectedDevice;
  }

  getAvailableDevices(): BluetoothDevice[] {
    return this.availableDevices;
  }

  // Format receipt data into a printable string
  formatReceiptData(data: ReceiptData): string {
    let receipt = '';
    
    // Header
    receipt += `\n${data.storeName}\n`;
    receipt += `${data.storeAddress}\n`;
    receipt += `WhatsApp: ${data.storeWhatsapp}\n`;
    receipt += `--------------------------------\n`;
    receipt += `Transaction ID: ${data.transactionId}\n`;
    receipt += `Date: ${data.date}\n`;
    receipt += `--------------------------------\n\n`;
    
    // Items
    data.items.forEach(item => {
      receipt += `${item.name}\n`;
      receipt += `${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}\n`;
    });
    
    // Totals
    receipt += `\n--------------------------------\n`;
    receipt += `Subtotal: ${formatCurrency(data.subtotal)}\n`;
    receipt += `Tax: ${formatCurrency(data.tax)}\n`;
    receipt += `Total: ${formatCurrency(data.total)}\n\n`;
    
    // Payment info
    receipt += `Payment: ${data.paymentMethod}\n`;
    if (data.amountPaid) {
      receipt += `Amount Paid: ${formatCurrency(data.amountPaid)}\n`;
      receipt += `Change: ${formatCurrency(data.change || 0)}\n`;
    }
    
    // Notes
    if (data.notes) {
      receipt += `\nNotes: ${data.notes}\n`;
    }
    
    // Footer
    receipt += `\n--------------------------------\n`;
    receipt += `Thank you for your purchase!\n\n`;
    
    return receipt;
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterService();
