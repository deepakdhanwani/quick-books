import type { Sale } from '../services/api';
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

export type SaleExportContext = {
  sale: Sale;
  company?: PdfCompanyInfo;
  platform?: PdfPlatformBranding;
  businessName?: string;
};

type SaleExportOptions = SharePdfOptions & {
  token?: string;
};

function invoiceRef(sale: Sale) {
  return sale.invoiceNumber ?? `Sale-${sale.id}`;
}

function buildSaleHtml({ sale, company, platform, businessName }: SaleExportContext) {
  const items = (sale.items ?? [])
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

  const payments = (sale.payments ?? [])
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
        renderInfoCard('Customer', sale.customerName),
        renderInfoCard('Invoice Date', formatDate(sale.date)),
        renderInfoCard('Payment Status', getPaymentStatusLabel(sale.paymentStatus)),
        renderInfoCard('Paid Amount', formatCurrency(sale.paidAmount)),
        renderInfoCard('Pending Amount', formatCurrency(sale.pendingAmount)),
        renderInfoCard('Net Amount', formatCurrency(sale.netAmount)),
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
        sale.grossAmount != null ? renderAmountSummaryRow('Gross Amount', formatCurrency(sale.grossAmount)) : '',
        sale.discountAmount != null && sale.discountAmount > 0
          ? renderAmountSummaryRow('Discount', formatCurrency(sale.discountAmount))
          : '',
        sale.taxPercent != null ? renderAmountSummaryRow('Tax %', `${sale.taxPercent}%`) : '',
        sale.taxAmount != null ? renderAmountSummaryRow('Tax Amount', formatCurrency(sale.taxAmount)) : '',
        renderAmountSummaryRow('Net Amount', formatCurrency(sale.netAmount), true),
        renderAmountSummaryRow('Paid', formatCurrency(sale.paidAmount)),
        renderAmountSummaryRow('Pending', formatCurrency(sale.pendingAmount)),
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
    ${sale.notes ? `<div class="notes-box"><strong>Notes:</strong> ${escapeHtml(sale.notes)}</div>` : ''}
  `;

  return buildPdfDocumentHtml({
    documentTitle: 'Tax Invoice',
    documentSubtitle: invoiceRef(sale),
    company: company ?? (businessName ? { name: businessName } : undefined),
    platform,
    bodyHtml,
  });
}

export async function exportSaleDocument(context: SaleExportContext, options?: SaleExportOptions) {
  const platform = context.platform ?? (options?.token ? await fetchPlatformBranding(options.token) : undefined);
  const fileStem = `invoice_${invoiceRef(context.sale)}`;
  await shareHtmlAsPdf(`${fileStem}.pdf`, buildSaleHtml({ ...context, platform }), options);
}
