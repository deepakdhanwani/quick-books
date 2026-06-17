import type { Purchase } from '../services/api';
import { formatCurrency, formatDate, getPaymentModeLabel, getPaymentStatusLabel } from './saleAmounts';
import { shareHtmlAsPdf, type SharePdfOptions } from './exportPdf';

type PurchaseExportContext = {
  purchase: Purchase;
  businessName?: string;
};

function billRef(purchase: Purchase) {
  return purchase.billNumber ?? `PO-${purchase.id}`;
}

function buildPurchaseHtml({ purchase, businessName }: PurchaseExportContext) {
  const items = (purchase.items ?? [])
    .map(
      (item) => `
      <tr>
        <td>${item.productName ?? item.description}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatCurrency(item.unitPrice)}</td>
        <td class="num">${formatCurrency(item.discount ?? 0)}</td>
        <td class="num">${formatCurrency(item.amount)}</td>
      </tr>`,
    )
    .join('');

  const payments = (purchase.payments ?? [])
    .map(
      (payment) => `
      <tr>
        <td>${formatDate(payment.date)}</td>
        <td class="num">${formatCurrency(payment.amount)}</td>
        <td>${payment.paymentMode ? getPaymentModeLabel(payment.paymentMode) : '—'}</td>
        <td class="num">${payment.adjustedAmount ? formatCurrency(payment.adjustedAmount) : '—'}</td>
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
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 18px; font-size: 12px; }
    .label { color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    .num { text-align: right; white-space: nowrap; }
    h2 { font-size: 14px; margin: 18px 0 8px; }
  </style>
</head>
<body>
  <h1>Purchase Order</h1>
  <div class="meta">
    ${businessName ? `<div>${businessName}</div>` : ''}
    <div>${billRef(purchase)}</div>
    <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
  </div>
  <div class="grid">
    <div><span class="label">Vendor</span><div>${purchase.vendorName}</div></div>
    <div><span class="label">Date</span><div>${formatDate(purchase.date)}</div></div>
    <div><span class="label">Status</span><div>${getPaymentStatusLabel(purchase.paymentStatus)}</div></div>
    <div><span class="label">Net Amount</span><div>${formatCurrency(purchase.netAmount)}</div></div>
    <div><span class="label">Paid</span><div>${formatCurrency(purchase.paidAmount)}</div></div>
    <div><span class="label">Pending</span><div>${formatCurrency(purchase.pendingAmount)}</div></div>
  </div>
  ${items ? `<h2>Line Items</h2><table><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Amount</th></tr></thead><tbody>${items}</tbody></table>` : ''}
  ${payments ? `<h2>Payments</h2><table><thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Adjusted</th></tr></thead><tbody>${payments}</tbody></table>` : ''}
  ${purchase.notes ? `<h2>Notes</h2><p>${purchase.notes}</p>` : ''}
</body>
</html>`;
}

export async function exportPurchaseDocument(
  context: PurchaseExportContext,
  options?: SharePdfOptions,
) {
  const fileStem = `purchase_${billRef(context.purchase)}`;
  await shareHtmlAsPdf(`${fileStem}.pdf`, buildPurchaseHtml(context), options);
}
