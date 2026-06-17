import type { PartyLedgerEntry } from '../services/api';
import { formatCurrency, formatDate } from './saleAmounts';
import { shareHtmlAsPdf, type SharePdfOptions } from './exportPdf';
import type { LedgerExportScope } from './ledgerExportScope';
import { ledgerScopeLabel } from './ledgerExportScope';
import type { LedgerPartyMode } from './partyLedger';

type LedgerExportContext = {
  mode: LedgerPartyMode;
  partyName: string;
  businessName?: string;
  fromDate: string;
  toDate: string;
  scope: LedgerExportScope;
  entries: PartyLedgerEntry[];
  openingDebit?: number;
  openingCredit?: number;
  openingBalance?: number;
};

function buildLedgerHtml(context: LedgerExportContext) {
  const title = context.mode === 'customer' ? 'Customer Ledger' : 'Vendor Ledger';
  const scopeLabel = ledgerScopeLabel(context.mode, context.scope);
  const includeOpening = context.scope === 'all';
  const openingDebit = includeOpening ? (context.openingDebit ?? 0) : 0;
  const openingCredit = includeOpening ? (context.openingCredit ?? 0) : 0;
  const openingRow =
    openingDebit > 0 || openingCredit > 0
      ? `
      <tr>
        <td>Opening</td>
        <td>Opening balance</td>
        <td>—</td>
        <td class="num">${openingDebit > 0 ? formatCurrency(openingDebit) : '—'}</td>
        <td class="num">${openingCredit > 0 ? formatCurrency(openingCredit) : '—'}</td>
        <td class="num">${formatCurrency(context.openingBalance ?? 0)}</td>
      </tr>`
      : '';

  const rows = context.entries
    .map(
      (entry) => `
      <tr>
        <td>${formatDate(entry.date)}</td>
        <td>${entry.particulars}</td>
        <td>${entry.referenceLabel}</td>
        <td class="num">${entry.debit > 0 ? formatCurrency(entry.debit) : '—'}</td>
        <td class="num">${entry.credit > 0 ? formatCurrency(entry.credit) : '—'}</td>
        <td class="num">${formatCurrency(entry.balance)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; }
    .num { text-align: right; white-space: nowrap; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    ${context.businessName ? `<div>${context.businessName}</div>` : ''}
    <div>${context.partyName}</div>
    <div>Scope: ${scopeLabel}</div>
    <div>Period: ${formatDate(context.fromDate)} to ${formatDate(context.toDate)}</div>
    <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Particulars</th>
        <th>Reference</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${openingRow}
      ${rows || (!openingRow ? '<tr><td colspan="6">No entries in selected period</td></tr>' : '')}
    </tbody>
  </table>
</body>
</html>`;
}

export async function exportLedger(context: LedgerExportContext, options?: SharePdfOptions) {
  const safeParty = context.partyName.replace(/\s+/g, '_');
  const scopeSlug = context.scope === 'all' ? 'complete' : context.scope;
  const fileStem = `${context.mode}_ledger_${scopeSlug}_${safeParty}_${context.fromDate}_${context.toDate}`;
  await shareHtmlAsPdf(`${fileStem}.pdf`, buildLedgerHtml(context), options);
}
