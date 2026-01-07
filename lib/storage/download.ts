// ============================================================================
// FILE DOWNLOAD HELPER
// ============================================================================

/**
 * Trigger browser download of file with proper MIME type
 * @param data - File content as Uint8Array
 * @param filename - Name for downloaded file
 * @throws {Error} If data is empty or filename is invalid
 * @throws {TypeError} If URL revocation fails (logged and suppressed)
 */
export function downloadFile(data: Uint8Array, filename: string): void {
  if (!data?.length) throw new Error('Data cannot be empty');
  if (!filename?.trim()) throw new Error('Filename cannot be empty');

  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError('SharedArrayBuffer not supported');
  }
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof TypeError) {
      console.warn('Failed to revoke object URL:', error);
    } else {
      throw error;
    }
  }
}
