
export const encryptKey = (key: string): string => {
  if (!key) return '';
  try {
    // Simple base64 obfuscation to prevent plain text reading. 
    // In a real production env with backend, use proper encryption.
    return btoa(encodeURIComponent(key));
  } catch (e) {
    console.error("Encryption failed", e);
    return '';
  }
};

export const decryptKey = (cipher: string): string => {
  if (!cipher) return '';
  try {
    return decodeURIComponent(atob(cipher));
  } catch (e) {
    console.error("Decryption failed", e);
    return '';
  }
};
