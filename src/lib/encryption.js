import CryptoJS from 'crypto-js';

/**
 * Generate a random 256-bit AES key
 * @returns {string} Base64 encoded AES key
 */
export function generateAESKey() {
  console.log('[Log] Generando clave AES-256...');
  // Generate 256 bits (32 bytes) of random data
  const key = CryptoJS.lib.WordArray.random(32);
  console.log('[Log] Clave generada: 32 bytes (256 bits)');
  // Convert to base64
  return CryptoJS.enc.Base64.stringify(key);
}

/**
 * Encrypt data using AES-256-CBC
 * @param {Object|string} data - Data to encrypt (will be JSON stringified if object)
 * @param {string} key - Base64 encoded AES key
 * @returns {string} Base64 encoded encrypted data (IV + ciphertext)
 */
export function encryptData(data, key) {
  console.log('[Log] Encriptando registro médico con AES-256-CBC...');

  // Convert data to JSON string if it's an object
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const originalSize = new Blob([jsonString]).size;
  console.log(`[Log] Tamaño original: ${originalSize.toLocaleString('es-ES')} bytes`);

  // Parse base64 key to WordArray
  const keyWordArray = CryptoJS.enc.Base64.parse(key);

  // Generate random IV (128 bits for AES)
  const iv = CryptoJS.lib.WordArray.random(16);

  // Encrypt using AES-256-CBC
  const encrypted = CryptoJS.AES.encrypt(jsonString, keyWordArray, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // Combine IV + ciphertext and encode as base64
  const combined = iv.concat(encrypted.ciphertext);
  const encryptedBase64 = CryptoJS.enc.Base64.stringify(combined);

  const encryptedSize = new Blob([encryptedBase64]).size;
  console.log(`[Log] Tamaño encriptado: ${encryptedSize.toLocaleString('es-ES')} bytes`);

  return encryptedBase64;
}

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedData - Base64 encoded encrypted data (IV + ciphertext)
 * @param {string} key - Base64 encoded AES key
 * @returns {Object|string} Decrypted data (parsed as JSON if possible)
 */
export function decryptData(encryptedData, key) {
  try {
    // Parse base64 encrypted data to WordArray
    const combined = CryptoJS.enc.Base64.parse(encryptedData);

    // Extract IV (first 16 bytes)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16);

    // Extract ciphertext (remaining bytes)
    const ciphertext = CryptoJS.lib.WordArray.create(
      combined.words.slice(4),
      combined.sigBytes - 16
    );

    // Parse base64 key to WordArray
    const keyWordArray = CryptoJS.enc.Base64.parse(key);

    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      keyWordArray,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    // Convert to UTF8 string
    const decryptedString = CryptoJS.enc.Utf8.stringify(decrypted);

    // Try to parse as JSON, otherwise return string
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
