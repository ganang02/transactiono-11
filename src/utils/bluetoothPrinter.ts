// Type definitions for Bluetooth printer functionality
export interface BluetoothDevice {
  id: string;
  name: string;
  device?: any; // Store the actual browser Bluetooth device
  address?: string; // Add address field for system-paired devices
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

  // Specific UUID sets for HS6632M Ver 1.0.4 printer
  private knownPrinterServices = [
    // HS6632M specific
    'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2',
    '000018f0-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '18F0',
    // Generic GATT services
    '1800', // Generic Access
    '1801', // Generic Attribute
    '180A', // Device Information
    '180F', // Battery Service
    // Special service for HS6632M Ver 1.0.4
    'FFB0',
    'FEE7',
    // Additional services that might be used by thermal printers
    'FF00',
    'FF10',
    '49535343-FE7D-4AE5-8FA9-9FAFD205E455',
    // Add more 58mm thermal printer service UUIDs
    '000018f0-0000-1000-8000-00805f9b34fb',  // Generic Thermal Printer
    'FFB0',  // Common 58mm printer service
    // Added more common printer services
    '000018f0-0000-1000-8000-00805f9b34fb',
    '00001101-0000-1000-8000-00805f9b34fb',  // Serial Port Profile
    '03B80E5A-EDE8-4B33-A751-6CE34EC4C700',  // Alternative printer service
    'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2',  // Common for HS printers
  ];
  
  private knownPrinterCharacteristics = [
    // HS6632M specific characteristics
    '00002af1-0000-1000-8000-00805f9b34fb',
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '2AF1',
    'BEF8D6C9-9C21-4C9E-B632-BD58C1009F9F',
    // Special characteristic for HS6632M Ver 1.0.4
    'FFB1', 
    'FFB2',
    'FEE8',
    // Additional characteristics for thermal printers
    'FF02',
    'FF01',
    '49535343-8841-43F4-A8D4-ECBE34729BB3',
    // Added more common characteristics
    '00002af1-0000-1000-8000-00805f9b34fb',
    '00002af0-0000-1000-8000-00805f9b34fb'
  ];

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
    
    // Log to show the utility was initialized
    console.log('Bluetooth Printer utility initialized');
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
      console.log('Found paired devices:', devices);
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
      console.log('Starting Bluetooth scan for HS6632M and other printers with longer timeout...');
      
      let device;
      try {
        // First try with specific filters for HS6632M and common printers
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'HS6632' },
            { namePrefix: 'HS' },
            { namePrefix: 'Printer' },
            { namePrefix: 'POS' },
            { namePrefix: 'ESC' },
            { namePrefix: 'BT' },
            // Add additional common thermal printer prefixes
            { namePrefix: 'Thermal' },
            { namePrefix: 'Mini' },
            { namePrefix: 'P' },
            // Added more options to increase chances of finding the device
            { namePrefix: 'Printer' },
            { namePrefix: 'print' },
            { namePrefix: 'th' },
            { namePrefix: 'POS' },
          ],
          optionalServices: this.knownPrinterServices,
          // Added a 20 second timeout - though this might not work in all browsers
          timeoutSeconds: 20
        });
      } catch (err) {
        console.log('Failed with namePrefix filters, trying acceptAllDevices:', err);
        // If that fails, try accepting all devices
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: this.knownPrinterServices,
          // Added a 20 second timeout - though this might not work in all browsers
          timeoutSeconds: 20
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

  async connectToSystemDevice(device: any): Promise<BluetoothDevice> {
    console.log('Connecting to system paired device:', device);
    
    if (!device || !device.gatt) {
      throw new Error('Invalid device provided');
    }
    
    try {
      console.log('Connecting to GATT server...');
      const server = await device.gatt.connect();
      
      console.log('GATT connected, getting primary services...');
      
      // Try different service UUIDs with priority for HS6632M Ver 1.0.4
      let service = null;
      
      // First try known services specific to HS6632M
      for (const uuid of this.knownPrinterServices) {
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
      
      // Try different characteristic UUIDs specific to HS6632M Ver 1.0.4
      for (const uuid of this.knownPrinterCharacteristics) {
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
      this.connectedDevice = {
        id: device.id,
        name: device.name || "System Printer",
        device: device
      };
      this.isDeviceConnected = true;
      
      console.log('Successfully connected to system paired printer');
      return this.connectedDevice;
    } catch (error) {
      console.error('Error connecting to system device:', error);
      this.isDeviceConnected = false;
      this.characteristic = null;
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
      console.log('Attempting GATT connection to HS6632M or similar printer...');
      const server = await device.device.gatt.connect();
      console.log('GATT connected, getting available services...');
      
      // Try different service UUIDs with priority for HS6632M Ver 1.0.4
      let service = null;
      
      for (const uuid of this.knownPrinterServices) {
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
      
      // Try different characteristic UUIDs specific to HS6632M Ver 1.0.4
      for (const uuid of this.knownPrinterCharacteristics) {
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
      
      // Format the receipt - optimize for HS6632M
      const receiptContent = this.formatReceiptContent(receiptData);
      
      // Convert text to bytes using ESC/POS commands
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptContent);
      
      // For HS6632M Ver 1.0.4, use smaller chunk size (tested for best performance)
      const CHUNK_SIZE = 48; // Even smaller chunks for more reliable printing with HS6632M
      
      // Print multiple copies if requested
      for (let copy = 0; copy < copies; copy++) {
        console.log(`Printing copy ${copy + 1} of ${copies}`);
        
        // Send initialization sequence first
        const initData = encoder.encode('\x1B@');
        await this.writeToCharacteristic(initData);
        
        // Small delay after initialization - important for HS6632M
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Send data in chunks
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          console.log(`Sending chunk ${i / CHUNK_SIZE + 1}, size: ${chunk.length} bytes`);
          
          await this.writeToCharacteristic(chunk);
          
          // Increased delay between chunks - critical for HS6632M Ver 1.0.4
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Add delay between copies
        if (copy < copies - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  // Helper method for writing to characteristic with fallback options
  private async writeToCharacteristic(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('No characteristic available for writing');
    }
    
    console.log(`Writing ${data.length} bytes to printer...`);
    
    // Try different write methods - HS6632M requires writeWithoutResponse
    try {
      // For HS6632M Ver 1.0.4, prefer writeValueWithoutResponse
      if (this.characteristic.properties.writeWithoutResponse) {
        console.log('Using writeValueWithoutResponse method');
        await this.characteristic.writeValueWithoutResponse(data);
      } else if (this.characteristic.properties.write) {
        console.log('Using writeValue method');
        await this.characteristic.writeValue(data);
      } else {
        // Fallback to generic write method
        console.log('Using fallback write method');
        await this.characteristic.write(data);
      }
      
      console.log('Data successfully written to characteristic');
    } catch (e) {
      console.error('Error writing to characteristic:', e);
      
      // Try alternative methods
      try {
        console.log('Trying alternative write methods...');
        // Try a different method
        if (typeof this.characteristic.writeValueWithoutResponse === 'function') {
          console.log('Trying writeValueWithoutResponse...');
          await this.characteristic.writeValueWithoutResponse(data);
        } else if (typeof this.characteristic.writeValue === 'function') {
          console.log('Trying writeValue...');
          await this.characteristic.writeValue(data);
        } else if (typeof this.characteristic.write === 'function') {
          console.log('Trying write...');
          await this.characteristic.write(data);
        } else {
          throw new Error('No working write method found');
        }
        
        console.log('Alternative write method succeeded');
      } catch (e2) {
        console.error('All write methods failed:', e2);
        throw new Error('Failed to send data to printer. Try reconnecting.');
      }
    }
  }

  // Add 58mm paper width support in ESC/POS formatting
  private formatReceiptContent(data: ReceiptData): string {
    let receipt = '';
    
    // Initialize for 58mm printer
    receipt += '\x1B@';  // Reset printer
    receipt += '\x1D(L\x04\x00\x30\x58\x02\x01';  // Set page mode for 58mm
    receipt += '\x1B\x63\x30\x02';  // Set line feed mode for thermal
    
    // Center and emphasize store name
    receipt += '\x1B\x61\x01'; // Center align
    receipt += '\x1B\x21\x08'; // Emphasized mode
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
    
    // Add paper cut and eject
    receipt += '\x0A\x0A';  // Extra paper feed
    receipt += '\x1D\x56\x41\x10';  // Partial paper cut
    
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
