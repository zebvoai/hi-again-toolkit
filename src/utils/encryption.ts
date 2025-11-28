const ENCRYPTION_KEY = 'zebvo-assist-encryption-key-v1';

export const encryptApiKey = (apiKey: string): string => {
  try {
    const encoded = btoa(apiKey);
    return encoded;
  } catch (error) {
    console.error('Encryption error:', error);
    return apiKey;
  }
};

export const decryptApiKey = (encryptedKey: string): string => {
  try {
    const decoded = atob(encryptedKey);
    return decoded;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedKey;
  }
};

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '****';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
};
