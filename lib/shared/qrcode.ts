// QR Code generation for vault links
import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
  margin?: number;
}

export async function generateVaultQR(
  vaultLink: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    errorCorrectionLevel = 'H', // High error correction for damaged codes
    width = 270,
    margin = 3,
  } = options;

  return QRCode.toDataURL(vaultLink, {
    errorCorrectionLevel,
    type: 'image/png',
    width,
    margin,
    color: {
      dark: '#000000', // Black for maximum contrast
      light: '#FFFFFF', // White background
    },
  });
}

export async function generateQRBuffer(
  vaultLink: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  return QRCode.toBuffer(vaultLink, {
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    width: options.width || 300,
    margin: options.margin || 4,
  });
}
