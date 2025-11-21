
let derivedKey: CryptoKey | null = null;
const SALT_KEY = 'lexigen_secure_salt_v1';

const getSalt = (): Uint8Array => {
  try {
    const existing = localStorage.getItem(SALT_KEY);
    if (existing) {
      const bin = atob(existing);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    }
  } catch {}
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  try {
    let b64 = '';
    for (let i = 0; i < salt.length; i++) b64 += String.fromCharCode(salt[i]);
    localStorage.setItem(SALT_KEY, btoa(b64));
  } catch {}
  return salt;
};

export const setPassphrase = async (passphrase: string) => {
  if (!passphrase || !('crypto' in window) || !window.isSecureContext) {
    derivedKey = null;
    return;
  }
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: getSalt(), iterations: 120000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const isSecureEnabled = () => !!derivedKey;

const toB64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let b64 = '';
  for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
  return btoa(b64);
};

const fromB64 = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const encryptKey = async (key: string): Promise<string> => {
  if (!key) return '';
  try {
    if (derivedKey && window.isSecureContext) {
      const iv = new Uint8Array(12);
      crypto.getRandomValues(iv);
      const enc = new TextEncoder();
      const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, enc.encode(key));
      return `${toB64(iv.buffer)}:${toB64(cipher)}`;
    }
    return btoa(encodeURIComponent(key));
  } catch {
    return '';
  }
};

export const decryptKey = async (cipher: string): Promise<string> => {
  if (!cipher) return '';
  try {
    if (derivedKey && window.isSecureContext && cipher.includes(':')) {
      const [ivB64, dataB64] = cipher.split(':');
      const iv = fromB64(ivB64);
      const data = fromB64(dataB64);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, data);
      const dec = new TextDecoder();
      return dec.decode(plain);
    }
    return decodeURIComponent(atob(cipher));
  } catch {
    return '';
  }
};
