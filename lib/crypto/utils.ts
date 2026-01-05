// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import { BLOB_SIZES, SIZE_CLASSES, Argon2ProfileName, ARGON2_PROFILES } from './constants';

// ============================================================================
// PURE FUNCTIONS - Exported
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 * @param n Number of bytes to generate
 * @returns Random bytes
 */
export function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  
  // crypto.getRandomValues has 65KB limit, generate in chunks
  const chunkSize = 65536;
  for (let i = 0; i < n; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, n));
    crypto.getRandomValues(chunk);
  }
  
  return bytes;
}

/**
 * Encode Argon2 parameters into 8-byte buffer
 * @param params Argon2 parameters
 * @returns Encoded buffer
 */
export function encodeArgonParams(params: { m: number; t: number; p: number }): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setUint32(0, params.m, true);
  view.setUint16(4, params.t, true);
  view.setUint16(6, params.p, true);
  return buf;
}

/**
 * Decode Argon2 parameters from 8-byte buffer
 * @param buf Encoded buffer
 * @returns Argon2 parameters
 */
export function decodeArgonParams(buf: Uint8Array): { m: number; t: number; p: number; dkLen: number } {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    m: view.getUint32(0, true),
    t: view.getUint16(4, true),
    p: view.getUint16(6, true),
    dkLen: 32
  };
}

/**
 * Constant-time byte array comparison
 * @param a First array
 * @param b Second array
 * @returns True if arrays are equal
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Select appropriate vault size class
 * @param contentLength Content length in bytes
 * @returns Size class in bytes
 */
export function selectVaultSize(contentLength: number): number {
  const overhead = BLOB_SIZES.header + BLOB_SIZES.salt + BLOB_SIZES.nonce + BLOB_SIZES.commitment + BLOB_SIZES.authTag;
  const required = contentLength + overhead;
  
  for (const size of SIZE_CLASSES) {
    if (required <= size) return size;
  }
  
  return SIZE_CLASSES[SIZE_CLASSES.length - 1];
}

/**
 * Detect device capabilities and select Argon2 profile
 * @returns Profile name
 */
export function detectArgonProfile(): Argon2ProfileName {
  if (typeof navigator === 'undefined') return 'desktop'; // Default for SSR
  
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  
  if (memory && memory < 4) return 'mobile';
  if (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) return 'desktop';
  
  return 'mobile';
}

/**
 * Wipe sensitive data from memory
 * @param data Data to wipe
 */
export function wipeMemory(data: Uint8Array): void {
  // crypto.getRandomValues has 65KB limit, wipe in chunks
  const chunkSize = 65536;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, Math.min(i + chunkSize, data.length));
    crypto.getRandomValues(chunk);
  }
  data.fill(0);
}

/**
 * Concatenate multiple Uint8Arrays
 * @param arrays Arrays to concatenate
 * @returns Concatenated array
 */
export function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Base64 URL-safe encoding
 * @param data Data to encode
 * @returns Base64 URL-safe string
 */
export function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL-safe decoding
 * @param str Base64 URL-safe string
 * @returns Decoded data
 */
export function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Encode text to Uint8Array
 * @param text Text to encode
 * @returns Encoded bytes
 */
export function encodeText(text: string): Uint8Array {
  return textEncoder.encode(text);
}

/**
 * Decode Uint8Array to text
 * @param data Data to decode
 * @returns Decoded text
 */
export function decodeText(data: Uint8Array): string {
  return textDecoder.decode(data);
}

/**
 * Encode 32-bit unsigned integer (little-endian)
 * @param value Value to encode
 * @returns Encoded bytes
 */
export function encodeU32LE(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  buf[2] = (value >> 16) & 0xff;
  buf[3] = (value >> 24) & 0xff;
  return buf;
}

/**
 * Decode 32-bit unsigned integer (little-endian)
 * @param buf Buffer to decode
 * @param offset Offset in buffer
 * @returns Decoded value
 */
export function decodeU32LE(buf: Uint8Array, offset = 0): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  ) >>> 0;
}

/**
 * Encode 16-bit unsigned integer (little-endian)
 * @param value Value to encode
 * @returns Encoded bytes
 */
export function encodeU16LE(value: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  return buf;
}

/**
 * Decode 16-bit unsigned integer (little-endian)
 * @param buf Buffer to decode
 * @param offset Offset in buffer
 * @returns Decoded value
 */
export function decodeU16LE(buf: Uint8Array, offset = 0): number {
  return buf[offset] | (buf[offset + 1] << 8);
}
