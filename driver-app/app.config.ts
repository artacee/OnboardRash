/**
 * Dynamic Expo config — extends app.json and injects the backend API URL.
 *
 * Priority for the baked-in API URL:
 *   1. EXPO_PUBLIC_API_URL env var  (set at build time or in .env)
 *   2. Falls back to nothing (runtime auto-detect will handle it)
 *
 * Usage:
 *   # Build with a specific backend:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:5000 npx expo export
 *
 *   # Or add to .env in the driver-app folder:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:5000
 */

import { ExpoConfig, ConfigContext } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        ...appJson.expo,
        extra: {
            ...appJson.expo.extra,
            // Bake the API URL into the binary so production builds know where
            // the backend lives — even without an Expo dev-server.
            apiUrl: process.env.EXPO_PUBLIC_API_URL || undefined,
        },
    };
};
