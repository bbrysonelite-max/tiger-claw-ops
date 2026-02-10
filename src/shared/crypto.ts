/**
 * Tiger Bot Scout - AES-256 Encryption Module
 * Handles secure encryption/decryption of bot tokens
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('[crypto] WARNING: ENCRYPTION_KEY not set in environment');
}

/**
 * Encrypts a plaintext string using AES-256
 * @param plaintext - The string to encrypt (e.g., bot token)
 * @returns Base64-encoded encrypted string
 */
export function encrypt(plaintext: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY);
  return encrypted.toString();
}

/**
 * Decrypts an AES-256 encrypted string
 * @param ciphertext - Base64-encoded encrypted string
 * @returns Original plaintext string
 */
export function decrypt(ciphertext: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  
  if (!decrypted) {
    throw new Error('Decryption failed - invalid ciphertext or wrong key');
  }
  
  return decrypted;
}

/**
 * Generates a SHA-256 hash of a string
 * Used for creating public webhook URL hashes from bot tokens
 * @param input - The string to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashToken(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

/**
 * Generates a short hash (first 16 chars) for URL-friendly webhook paths
 * @param input - The string to hash
 * @returns First 16 characters of SHA-256 hash
 */
export function shortHash(input: string): string {
  return hashToken(input).substring(0, 16);
}
