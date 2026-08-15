import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hnefatafl.vikingchess',
  appName: 'Hnefatafl',
  webDir: 'dist',
  android: {
    backgroundColor: '#020617',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
