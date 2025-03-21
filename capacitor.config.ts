
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mycompany.posapp',
  appName: 'POS System',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP connections for development
    hostname: 'localhost',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
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
    webContentsDebuggingEnabled: true
  }
};

export default config;
