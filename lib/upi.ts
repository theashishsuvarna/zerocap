/**
 * Generates a UPI payment URI string.
 * Format: upi://pay?pa=<payee>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<txnid>
 */
export function generateUpiUri(params: {
  payeeId: string;
  payeeName?: string;
  amount: number;
  note?: string;
  txnRef?: string;
}): string {
  const { payeeId, payeeName, amount, note, txnRef } = params;
  const parts = [
    `pa=${encodeURIComponent(payeeId)}`,
  ];
  if (payeeName) parts.push(`pn=${encodeURIComponent(payeeName)}`);
  if (amount > 0) parts.push(`am=${amount.toFixed(2)}`);
  parts.push(`cu=INR`);
  if (note) parts.push(`tn=${encodeURIComponent(note)}`);
  if (txnRef) parts.push(`tr=${encodeURIComponent(txnRef)}`);
  return `upi://pay?${parts.join('&')}`;
}

/**
 * Generates a QR code as an SVG data URI using a minimal QR encoder.
 * Falls back to a public QR generation API if local encoding is not available.
 */
export async function generateQrDataUri(text: string): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch {
    // Fallback: use a simple API-based QR generator
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(text)}`;
  }
}
