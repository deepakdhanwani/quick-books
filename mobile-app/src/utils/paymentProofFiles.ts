export const PAYMENT_PROOF_PICKER_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function sanitizePaymentProofFileName(fileName?: string): string {
  const trimmed = (fileName?.trim() || 'payment-proof').replace(/[^\w.\- ]/g, '_');
  return trimmed || 'payment-proof';
}

export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) {
    return 'application/octet-stream';
  }
  return EXTENSION_TO_MIME[extension] ?? 'application/octet-stream';
}

export function resolveMimeType(fileName: string, contentType?: string | null): string {
  const normalized = contentType?.split(';')[0]?.trim();
  if (normalized && normalized !== 'application/octet-stream') {
    return normalized;
  }
  return getMimeTypeFromFileName(fileName);
}
