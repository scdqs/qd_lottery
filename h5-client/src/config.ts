/**
 * Configuration helper
 * Handles environment variables for both Vite and Jest
 */

// Helper to get environment variable
const getEnvVar = (key: string, defaultValue: string): string => {
  // In browser with Vite, use import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  // In test environment (Jest), use process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  return defaultValue;
};

export const config = {
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:3000'),
  WS_URL: getEnvVar('VITE_WS_URL', 'http://localhost:3000'),
};
