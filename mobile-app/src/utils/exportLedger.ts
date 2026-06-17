import type { PartyLedgerEntry } from '../services/api';
import { formatCurrency, formatDate } from './saleAmounts';
import { shareHtmlAsPdf, type SharePdfOptions } from './exportPdf';
import type { LedgerExportScope } from './ledgerExportScope';
import { ledgerScopeLabel } from './ledgerExportScope';
import type { LedgerPartyMode } from './partyLedger';
import {
  buildPdfDocumentHtml,
  escapeHtml,
  type PdfCompanyInfo,
  type PdfPlatformBranding,
  renderInfoCard,
  renderInfoGrid,
  renderSection,
} from './pdfDocument';
import { fetchPlatformBranding } from './platformBranding';

export type LedgerExportContext = {
  mode: LedgerPartyMode;
  partyName: string;
  company?: PdfCompanyInfo;
  platform?: PdfPlatformBranding;
  businessName?: string;
  fromDate: string;
  toDate: string;
  scope: LedgerExportScope;
  entries: PartyLedgerEntry[];
  openingDebit?: number;
  openingCredit?: number;
  openingBalance?: number;
};

type LedgerExportOptions = SharePdfOptions & {
  token?: string;
};

function entryAmount(entry: PartyLedgerEntry) {
  return entry.debit > 0 ? entry.debit : entry.credit;
}

function buildLedgerHtml(context: LedgerExportContext) {
  const title = context.mode === 'customer' ? 'Customer Ledger' : 'Vendor Ledger';
  const scopeLabel = ledgerScopeLabel(context.mode, context.scope);
  const isFullLedger = context.scope === 'all';
  const includeOpening = isFullLedger;
  const openingDebit = includeOpening ? (context.openingDebit ?? 0) : 0;
  const openingCredit = includeOpening ? (context.openingCredit ?? 0) : 0;
  const openingRow =
    openingDebit > 0 || openingCredit > 0
      ? `
      <tr class="opening-row">
        <td>Opening</td>
        <td>Opening balance</td>
        <td>—</td>
        <td class="num">${openingDebit > 0 ? escapeHtml(formatCurrency(openingDebit)) : '—'}</td>
        <td class="num">${openingCredit > 0 ? escapeHtml(formatCurrency(openingCredit)) : '—'}</td>
        <td class="num">${escapeHtml(formatCurrency(context.openingBalance ?? 0))}</td>
      </tr>`
      : '';

  const scopedRows = context.entries
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(formatDate(entry.date))}</td>
        <td>${escapeHtml(entry.particulars)}</td>
        <td>${escapeHtml(entry.referenceLabel)}</td>
        <td class="num">${escapeHtml(formatCurrency(entryAmount(entry)))}</td>
      </tr>`,
    )
    .join('');

  const fullRows = context.entries
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(formatDate(entry.date))}</td>
        <td>${escapeHtml(entry.particulars)}</td>
        <td>${escapeHtml(entry.referenceLabel)}</td>
        <td class="num">${entry.debit > 0 ? escapeHtml(formatCurrency(entry.debit)) : '—'}</td>
        <td class="num">${entry.credit > 0 ? escapeHtml(formatCurrency(entry.credit)) : '—'}</td>
        <td class="num">${escapeHtml(formatCurrency(entry.balance))}</td>
      </tr>`,
    )
    .join('');

  const entryTotal = context.entries.reduce((sum, entry) => sum + entryAmount(entry), 0);
  const closingBalance =
    context.entries.length > 0
      ? context.entries[context.entries.length - 1].balance
      : (context.openingBalance ?? 0);

  const summaryCards = isFullLedger
    ? [
        renderInfoCard('Party', context.partyName),
        renderInfoCard('Scope', scopeLabel),
        renderInfoCard('Period', `${formatDate(context.fromDate)} to ${formatDate(context.toDate)}`),
        renderInfoCard('Closing Balance', formatCurrency(closingBalance)),
      ]
    : [
        renderInfoCard('Party', context.partyName),
        renderInfoCard('Scope', scopeLabel),
        renderInfoCard('Period', `${formatDate(context.fromDate)} to ${formatDate(context.toDate)}`),
        renderInfoCard('Total', formatCurrency(entryTotal)),
      ];

  const tableHead = isFullLedger
    ? `<tr>
            <th>Date</th>
            <th>Particulars</th>
            <th>Reference</th>
            <th class="num">Debit</th>
            <th class="num">Credit</th>
            <th class="num">Balance</th>
          </tr>`
    : `<tr>
            <th>Date</th>
            <th>Particulars</th>
            <th>Reference</th>
            <th class="num">Amount</th>
          </tr>`;

  const tableBody = isFullLedger
    ? `${openingRow}${fullRows || (!openingRow ? '<tr class="empty-row"><td colspan="6">No entries in selected period</td></tr>' : '')}`
    : `${scopedRows || '<tr class="empty-row"><td colspan="4">No entries in selected period</td></tr>'}`;

  const sectionTitle =
    context.scope === 'documents'
      ? context.mode === 'customer'
        ? 'Invoices'
        : 'Bills'
      : context.scope === 'payments'
        ? 'Payments'
        : 'Ledger Entries';

  const bodyHtml = `
    ${renderInfoGrid(summaryCards.join(''))}
    ${renderSection(
      sectionTitle,
      `<table class="data-table">
        <thead>
          ${tableHead}
        </thead>
        <tbody>
          ${tableBody}
        </tbody>
      </table>`,
    )}
  `;

  return buildPdfDocumentHtml({
    documentTitle: title,
    documentSubtitle: context.partyName,
    company: context.company ?? (context.businessName ? { name: context.businessName } : undefined),
    platform: context.platform,
    bodyHtml,
  });
}

export async function exportLedger(context: LedgerExportContext, options?: LedgerExportOptions) {
  const platform = context.platform ?? (options?.token ? await fetchPlatformBranding(options.token) : undefined);
  const safeParty = context.partyName.replace(/\s+/g, '_');
  const scopeSlug = context.scope === 'all' ? 'complete' : context.scope;
  const fileStem = `${context.mode}_ledger_${scopeSlug}_${safeParty}_${context.fromDate}_${context.toDate}`;
  await shareHtmlAsPdf(`${fileStem}.pdf`, buildLedgerHtml({ ...context, platform }), options);
}
