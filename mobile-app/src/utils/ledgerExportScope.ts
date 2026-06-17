import type { PartyLedgerEntry } from '../services/api';
import type { LedgerPartyMode } from './partyLedger';

export type LedgerExportScope = 'all' | 'documents' | 'payments';

export function defaultLedgerExportScope(): LedgerExportScope {
  return 'all';
}

export function ledgerScopeOptions(mode: LedgerPartyMode) {
  const documentLabel = mode === 'customer' ? 'Invoices only' : 'Bills only';
  return [
    { id: 'all' as const, label: 'Complete ledger', hint: 'Opening balance, documents, and payments' },
    { id: 'documents' as const, label: documentLabel, hint: mode === 'customer' ? 'Sales / invoice entries' : 'Purchase / bill entries' },
    { id: 'payments' as const, label: 'Payments only', hint: mode === 'customer' ? 'Payments received' : 'Payments made' },
  ];
}

export function ledgerScopeLabel(mode: LedgerPartyMode, scope: LedgerExportScope) {
  return ledgerScopeOptions(mode).find((option) => option.id === scope)?.label ?? 'Complete ledger';
}

function documentKind(mode: LedgerPartyMode) {
  return mode === 'customer' ? 'INVOICE' : 'BILL';
}

function paymentKind(mode: LedgerPartyMode) {
  return mode === 'customer' ? 'PAYMENT_IN' : 'PAYMENT_OUT';
}

export function filterLedgerEntriesByScope(
  entries: PartyLedgerEntry[],
  mode: LedgerPartyMode,
  scope: LedgerExportScope,
) {
  if (scope === 'all') {
    return entries;
  }
  if (scope === 'documents') {
    const kind = documentKind(mode);
    return entries.filter((entry) => entry.kind === kind);
  }
  const kind = paymentKind(mode);
  return entries.filter((entry) => entry.kind === kind);
}

export function recalculateLedgerBalances(
  entries: PartyLedgerEntry[],
  mode: LedgerPartyMode,
  openingBalance = 0,
) {
  const chronological = [...entries].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return left.id.localeCompare(right.id);
  });

  let balance = openingBalance;
  const updated = chronological.map((entry) => {
    if (mode === 'customer') {
      balance = balance + entry.debit - entry.credit;
    } else {
      balance = balance + entry.credit - entry.debit;
    }
    return { ...entry, balance };
  });

  return updated.reverse();
}

export function prepareLedgerEntriesForExport(
  entries: PartyLedgerEntry[],
  mode: LedgerPartyMode,
  scope: LedgerExportScope,
  openingBalance = 0,
) {
  const filtered = filterLedgerEntriesByScope(entries, mode, scope);
  if (scope === 'all') {
    return filtered;
  }
  return recalculateLedgerBalances(filtered, mode, openingBalance);
}
