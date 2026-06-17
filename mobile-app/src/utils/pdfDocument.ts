import type { SubscriberAccountProfile } from '../services/api';

export type PdfCompanyInfo = {
  name: string;
  businessTypeName?: string;
  ownerName?: string;
  phone?: string;
  gstNumber?: string;
};

export type PdfPlatformBranding = {
  companyName?: string;
  supportEmail?: string;
  contactEmail?: string;
  mobileNumber?: string;
  websiteUrl?: string;
};

export function escapeHtml(value: string | number | null | undefined) {
  if (value == null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPdfCompanyInfo(
  profile: SubscriberAccountProfile | null | undefined,
  activeCompanyId?: number,
  businessNameFallback?: string,
): PdfCompanyInfo | undefined {
  if (!profile && !businessNameFallback) {
    return undefined;
  }

  const activeCompany = profile?.companies?.find((company) => company.id === activeCompanyId);
  const name = activeCompany?.name ?? profile?.businessName ?? businessNameFallback;
  if (!name) {
    return undefined;
  }

  return {
    name,
    businessTypeName: activeCompany?.businessTypeName ?? profile?.businessTypeName,
    ownerName: profile?.ownerName,
    phone: profile?.phone,
    gstNumber: profile?.gstNumber,
  };
}

function renderCompanyMetaLine(label: string, value?: string) {
  if (!value?.trim()) {
    return '';
  }
  return `<div class="company-meta-line"><span class="meta-label">${escapeHtml(label)}</span> <span class="meta-value">${escapeHtml(value)}</span></div>`;
}

function renderFooterItem(label: string, value?: string) {
  if (!value?.trim()) {
    return '';
  }
  return `<span class="footer-item"><span class="footer-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</span>`;
}

function platformDisplayName(platform?: PdfPlatformBranding) {
  const name = platform?.companyName?.trim();
  return name || 'Quick Books';
}

function buildFooter(platform?: PdfPlatformBranding) {
  const items = [
    renderFooterItem('Support', platform?.supportEmail),
    renderFooterItem('Contact', platform?.contactEmail),
    renderFooterItem('Phone', platform?.mobileNumber),
    renderFooterItem('Web', platform?.websiteUrl),
  ].filter(Boolean);

  if (items.length === 0) {
    return `<div class="doc-footer-inner"><span class="footer-powered">Powered by ${escapeHtml(platformDisplayName(platform))}</span></div>`;
  }

  return `<div class="doc-footer-inner">
    <span class="footer-powered">Powered by ${escapeHtml(platformDisplayName(platform))}</span>
    <span class="footer-separator">|</span>
    ${items.join('<span class="footer-separator">|</span>')}
  </div>`;
}

export type PdfDocumentOptions = {
  documentTitle: string;
  documentSubtitle?: string;
  generatedAt?: string;
  company?: PdfCompanyInfo;
  platform?: PdfPlatformBranding;
  bodyHtml: string;
};

export function buildPdfDocumentHtml({
  documentTitle,
  documentSubtitle,
  generatedAt = new Date().toLocaleString('en-IN'),
  company,
  platform,
  bodyHtml,
}: PdfDocumentOptions) {
  const watermark = platformDisplayName(platform);
  const companyMeta = [
    renderCompanyMetaLine('Phone', company?.phone),
    renderCompanyMetaLine('GSTIN', company?.gstNumber),
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 22mm 14mm;
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
      background: #ffffff;
    }

    .watermark {
      position: fixed;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-32deg);
      font-size: 58px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(37, 99, 235, 0.07);
      white-space: nowrap;
      z-index: 0;
      pointer-events: none;
      text-transform: uppercase;
    }

    .page {
      position: relative;
      z-index: 1;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 0;
    }

    .company-block {
      flex: 1;
      min-width: 0;
    }

    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 8px;
      line-height: 1.2;
    }

    .company-meta-line {
      font-size: 11px;
      color: #475569;
      margin-bottom: 3px;
    }

    .meta-label {
      font-weight: 600;
      color: #64748b;
    }

    .meta-value {
      color: #0f172a;
    }

    .doc-title-block {
      text-align: right;
      min-width: 180px;
    }

    .doc-type {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #2563eb;
      margin-bottom: 6px;
    }

    .doc-ref {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .doc-generated {
      font-size: 10px;
      color: #94a3b8;
    }

    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 55%, #1e3a5f 100%);
      border-radius: 999px;
      margin: 14px 0 18px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 0 0 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
      margin-bottom: 18px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .info-card-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .info-card-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }

    .info-card-value.muted {
      font-weight: 500;
      color: #475569;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-top: 4px;
      overflow: hidden;
      border-radius: 10px;
    }

    table.data-table thead th {
      background: #1e3a5f;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 9px 10px;
      text-align: left;
      border: 1px solid #1e3a5f;
    }

    table.data-table tbody td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #0f172a;
    }

    table.data-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }

    table.data-table tbody tr.opening-row td {
      background: #eff6ff;
      font-weight: 600;
    }

    table.data-table tbody tr.total-row td {
      background: #e2e8f0;
      font-weight: 700;
    }

    .num {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .amount-summary {
      margin-top: 14px;
      margin-left: auto;
      width: min(100%, 280px);
      border: 1px solid #dbeafe;
      border-radius: 10px;
      overflow: hidden;
    }

    .amount-summary table {
      width: 100%;
      border-collapse: collapse;
    }

    .amount-summary td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }

    .amount-summary tr:last-child td {
      border-bottom: none;
      background: #eff6ff;
      font-weight: 700;
      color: #1e3a5f;
    }

    .amount-summary .label {
      color: #64748b;
    }

    .amount-summary .value {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .notes-box {
      margin-top: 16px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
      font-size: 11px;
    }

    .empty-row td {
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      padding: 18px;
    }

    .doc-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 8px 14mm 10px;
      font-size: 9px;
      color: #64748b;
      z-index: 2;
    }

    .doc-footer-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      justify-content: center;
      text-align: center;
    }

    .footer-powered {
      font-weight: 700;
      color: #2563eb;
    }

    .footer-label {
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-right: 3px;
    }

    .footer-separator {
      color: #cbd5e1;
    }

    .content-section {
      margin-bottom: 18px;
    }
  </style>
</head>
<body>
  <div class="watermark">${escapeHtml(watermark)}</div>
  <div class="page">
    <header class="doc-header">
      <div class="company-block">
        ${company?.name ? `<div class="company-name">${escapeHtml(company.name)}</div>` : ''}
        ${companyMeta}
      </div>
      <div class="doc-title-block">
        <div class="doc-type">${escapeHtml(documentTitle)}</div>
        ${documentSubtitle ? `<div class="doc-ref">${escapeHtml(documentSubtitle)}</div>` : ''}
        <div class="doc-generated">Generated ${escapeHtml(generatedAt)}</div>
      </div>
    </header>
    <div class="accent-bar"></div>
    ${bodyHtml}
  </div>
  <footer class="doc-footer">${buildFooter(platform)}</footer>
</body>
</html>`;
}

export function renderInfoCard(label: string, value: string, muted = false) {
  return `<div class="info-card">
    <div class="info-card-label">${escapeHtml(label)}</div>
    <div class="info-card-value${muted ? ' muted' : ''}">${escapeHtml(value)}</div>
  </div>`;
}

export function renderInfoGrid(cards: string) {
  return `<div class="info-grid">${cards}</div>`;
}

export function renderSection(title: string, content: string) {
  return `<section class="content-section">
    <h2 class="section-title">${escapeHtml(title)}</h2>
    ${content}
  </section>`;
}

export function renderAmountSummaryRow(label: string, value: string, emphasize = false) {
  return `<tr${emphasize ? ' class="total-row"' : ''}>
    <td class="label">${escapeHtml(label)}</td>
    <td class="value">${escapeHtml(value)}</td>
  </tr>`;
}

export function renderAmountSummary(rows: string) {
  return `<div class="amount-summary"><table><tbody>${rows}</tbody></table></div>`;
}
