import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.bhgo.analizplatformu',
    appName: 'BHGO Sınav Analiz',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
