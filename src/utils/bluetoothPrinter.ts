
// Bluetooth Printer Utility
// This utility provides functions to interact with Bluetooth printers

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
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

  // Mock function to simulate scanning for devices
  async scanForDevices(): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
      return this.availableDevices;
    }

    this.isScanning = true;
    
    // Simulate device discovery
    console.log('Scanning for Bluetooth devices...');
    
    try {
      // In a real implementation, this would use the Web Bluetooth API
      // or a native plugin for actual device discovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock devices for demonstration
      this.availableDevices = [
        { id: 'device1', name: 'Thermal Printer', connected: false },
        { id: 'device2', name: 'ESC/POS Printer', connected: false },
        { id: 'device3', name: 'Receipt Printer', connected: false }
      ];
      
      console.log('Found devices:', this.availableDevices);
      return this.availableDevices;
    } catch (error) {
      console.error('Error scanning for devices:', error);
      throw new Error('Failed to scan for devices');
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
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update device status
      device.connected = true;
      this.selectedDevice = device;
      
      console.log('Connected to device:', device.name);
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw new Error('Failed to connect to device');
    }
  }

  async disconnectFromDevice(): Promise<void> {
    if (!this.selectedDevice) {
      console.log('No device connected');
      return;
    }
    
    console.log(`Disconnecting from device: ${this.selectedDevice.name}`);
    
    try {
      // Simulate disconnection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.selectedDevice.connected = false;
      this.selectedDevice = null;
      
      console.log('Disconnected from device');
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw new Error('Failed to disconnect from device');
    }
  }

  async printReceipt(options: PrintOptions): Promise<boolean> {
    if (!this.selectedDevice) {
      throw new Error('No printer connected');
    }
    
    const { receiptData, copies = 1 } = options;
    
    console.log(`Printing receipt to ${this.selectedDevice.name}`);
    console.log('Receipt data:', receiptData);
    console.log(`Number of copies: ${copies}`);
    
    try {
      // Simulate printing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would format the data for the printer
      // and send it via the Bluetooth connection
      
      console.log('Receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw new Error('Failed to print receipt');
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
