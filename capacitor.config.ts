
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mycompany.posapp',
  appName: 'POS System',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP connections for development
    // Use a fallback mode that allows the app to run offline if server is unreachable
    errorPath: 'error.html',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    BluetoothLe: {
      displayStrings: {
        scanning: "Mencari perangkat...",
        cancel: "Batal",
        availableDevices: "Perangkat tersedia",
        noDeviceFound: "Tidak ada perangkat ditemukan"
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#F7F8FB",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    }
  },
  android: {
    allowMixedContent: true, // Allow HTTP requests in production
    captureInput: true,
    webContentsDebuggingEnabled: true,
    permissions: [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION"
    ]
  }
};

export default config;
