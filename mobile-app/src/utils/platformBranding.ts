import { api } from '../services/api';
import type { PdfPlatformBranding } from './pdfDocument';

let cachedBranding: PdfPlatformBranding | null = null;
let cacheToken: string | null = null;

export async function fetchPlatformBranding(token: string): Promise<PdfPlatformBranding> {
  if (cachedBranding && cacheToken === token) {
    return cachedBranding;
  }

  const branding = await api.getPlatformBranding(token);
  cachedBranding = branding;
  cacheToken = token;
  return branding;
}

export function clearPlatformBrandingCache() {
  cachedBranding = null;
  cacheToken = null;
}
