
// Type definition for Web Bluetooth API
interface BluetoothDevice {
  gatt: {
    connect: () => Promise<BluetoothRemoteGATTServer>;
  };
  name: string;
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
      filters?: Array<{ services?: string[] | BluetoothServiceUUID[], name?: string }>;
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }) => Promise<BluetoothDevice>;
  };
}

// Check if Bluetooth is available in the browser
export function isBluetoothSupported(): boolean {
  return !!(navigator as NavigatorWithBluetooth).bluetooth;
}

// Request Bluetooth printer device
export async function requestBluetoothDevice(): Promise<BluetoothDevice | null> {
  try {
    if (!isBluetoothSupported()) {
      throw new Error('Bluetooth not supported');
    }
    
    const device = await (navigator as NavigatorWithBluetooth).bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });
    
    return device;
  } catch (error) {
    console.error('Error requesting Bluetooth device:', error);
    return null;
  }
}

// Connect to Bluetooth printer and send data
export async function printReceipt(device: BluetoothDevice, text: string): Promise<boolean> {
  try {
    console.log('Connecting to device:', device.name);
    
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    
    // Prepare the text data
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Send the data
    await characteristic.writeValue(data);
    console.log('Data sent successfully');
    
    // Disconnect
    server.disconnect();
    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    return false;
  }
}

// Format receipt content
export function formatReceiptContent(transaction: any, storeInfo: any): string {
  // Format the receipt as text
  let receipt = '';
  
  // Store information
  receipt += `${storeInfo.name}\n`;
  receipt += `${storeInfo.address}\n`;
  receipt += `WhatsApp: ${storeInfo.whatsapp}\n`;
  receipt += '--------------------------------\n';
  
  // Transaction information
  receipt += `Transaction ID: ${transaction.id}\n`;
  receipt += `Date: ${new Date(transaction.date).toLocaleString('id-ID')}\n`;
  receipt += '--------------------------------\n';
  
  // Items
  transaction.items.forEach(item => {
    receipt += `${item.productName}\n`;
    receipt += `${item.quantity} x ${item.price.toLocaleString('id-ID')} = Rp ${item.subtotal.toLocaleString('id-ID')}\n`;
  });
  
  receipt += '--------------------------------\n';
  
  // Totals
  receipt += `TOTAL: Rp ${transaction.total.toLocaleString('id-ID')}\n`;
  
  if (transaction.amountPaid) {
    receipt += `CASH: Rp ${transaction.amountPaid.toLocaleString('id-ID')}\n`;
    receipt += `CHANGE: Rp ${transaction.change.toLocaleString('id-ID')}\n`;
  }
  
  receipt += '--------------------------------\n';
  receipt += `${storeInfo.notes || 'Thank you for your purchase!'}\n\n\n`;
  
  return receipt;
}
