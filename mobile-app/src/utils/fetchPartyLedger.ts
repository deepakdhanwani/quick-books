import { api, PartyLedgerEntry } from '../services/api';

const EXPORT_PAGE_SIZE = 100;

export async function fetchAllPartyLedgerEntries(
  token: string,
  mode: 'customer' | 'vendor',
  partyId: number,
  fromDate: string,
  toDate: string,
) {
  const all: PartyLedgerEntry[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const response =
      mode === 'customer'
        ? await api.getCustomerLedger(token, partyId, page, EXPORT_PAGE_SIZE, fromDate, toDate)
        : await api.getVendorLedger(token, partyId, page, EXPORT_PAGE_SIZE, fromDate, toDate);

    all.push(...response.content);
    totalPages = response.totalPages;
    page += 1;
  }

  return all;
}
