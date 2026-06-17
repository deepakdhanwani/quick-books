import type { Purchase } from '../services/api';
import { formatCurrency, formatDate, getPaymentModeLabel, getPaymentStatusLabel } from './saleAmounts';
import { shareHtmlAsPdf, type SharePdfOptions } from './exportPdf';
import {
  buildPdfDocumentHtml,
  escapeHtml,
  type PdfCompanyInfo,
  type PdfPlatformBranding,
  renderAmountSummary,
  renderAmountSummaryRow,
  renderInfoCard,
  renderInfoGrid,
  renderSection,
} from './pdfDocument';
import { fetchPlatformBranding } from './platformBranding';

export type PurchaseExportContext = {
  purchase: Purchase;
  company?: PdfCompanyInfo;
  platform?: PdfPlatformBranding;
  businessName?: string;
};

type PurchaseExportOptions = SharePdfOptions & {
  token?: string;
};

function billRef(purchase: Purchase) {
  return purchase.billNumber ?? `PO-${purchase.id}`;
}

function buildPurchaseHtml({ purchase, company, platform, businessName }: PurchaseExportContext) {
  const items = (purchase.items ?? [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.productName ?? item.description)}</td>
        <td class="num">${escapeHtml(item.quantity)}</td>
        <td class="num">${escapeHtml(formatCurrency(item.unitPrice))}</td>
        <td class="num">${escapeHtml(formatCurrency(item.discount ?? 0))}</td>
        <td class="num">${escapeHtml(formatCurrency(item.amount))}</td>
      </tr>`,
    )
    .join('');

  const payments = (purchase.payments ?? [])
    .map(
      (payment) => `
      <tr>
        <td>${escapeHtml(formatDate(payment.date))}</td>
        <td class="num">${escapeHtml(formatCurrency(payment.amount))}</td>
        <td>${escapeHtml(payment.paymentMode ? getPaymentModeLabel(payment.paymentMode) : '—')}</td>
        <td class="num">${escapeHtml(payment.adjustedAmount ? formatCurrency(payment.adjustedAmount) : '—')}</td>
      </tr>`,
    )
    .join('');

  const bodyHtml = `
    ${renderInfoGrid(
      [
        renderInfoCard('Vendor', purchase.vendorName),
        renderInfoCard('Bill Date', formatDate(purchase.date)),
        renderInfoCard('Payment Status', getPaymentStatusLabel(purchase.paymentStatus)),
        renderInfoCard('Paid Amount', formatCurrency(purchase.paidAmount)),
        renderInfoCard('Pending Amount', formatCurrency(purchase.pendingAmount)),
        renderInfoCard('Net Amount', formatCurrency(purchase.netAmount)),
      ].join(''),
    )}
    ${
      items
        ? renderSection(
            'Line Items',
            `<table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="num">Qty</th>
                  <th class="num">Rate</th>
                  <th class="num">Discount</th>
                  <th class="num">Amount</th>
                </tr>
              </thead>
              <tbody>${items}</tbody>
            </table>`,
          )
        : ''
    }
    ${renderAmountSummary(
      [
        purchase.grossAmount != null ? renderAmountSummaryRow('Gross Amount', formatCurrency(purchase.grossAmount)) : '',
        purchase.discountAmount != null && purchase.discountAmount > 0
          ? renderAmountSummaryRow('Discount', formatCurrency(purchase.discountAmount))
          : '',
        purchase.taxPercent != null ? renderAmountSummaryRow('Tax %', `${purchase.taxPercent}%`) : '',
        purchase.taxAmount != null ? renderAmountSummaryRow('Tax Amount', formatCurrency(purchase.taxAmount)) : '',
        renderAmountSummaryRow('Net Amount', formatCurrency(purchase.netAmount), true),
        renderAmountSummaryRow('Paid', formatCurrency(purchase.paidAmount)),
        renderAmountSummaryRow('Pending', formatCurrency(purchase.pendingAmount)),
      ]
        .filter(Boolean)
        .join(''),
    )}
    ${
      payments
        ? renderSection(
            'Payments',
            `<table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="num">Amount</th>
                  <th>Mode</th>
                  <th class="num">Adjusted</th>
                </tr>
              </thead>
              <tbody>${payments}</tbody>
            </table>`,
          )
        : ''
    }
    ${purchase.notes ? `<div class="notes-box"><strong>Notes:</strong> ${escapeHtml(purchase.notes)}</div>` : ''}
  `;

  return buildPdfDocumentHtml({
    documentTitle: 'Purchase Order',
    documentSubtitle: billRef(purchase),
    company: company ?? (businessName ? { name: businessName } : undefined),
    platform,
    bodyHtml,
  });
}

export async function exportPurchaseDocument(
  context: PurchaseExportContext,
  options?: PurchaseExportOptions,
) {
  const platform = context.platform ?? (options?.token ? await fetchPlatformBranding(options.token) : undefined);
  const fileStem = `purchase_${billRef(context.purchase)}`;
  await shareHtmlAsPdf(`${fileStem}.pdf`, buildPurchaseHtml({ ...context, platform }), options);
}
