import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.christmasjourney.santa',
  appName: "Santa's Christmas Journey",
  webDir: 'dist',
  backgroundColor: '#050b1c',
  android: {
    backgroundColor: '#050b1c',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#050b1c',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    Preferences: {
      group: 'santas-christmas-journey',
    },
  },
};

export default config;
