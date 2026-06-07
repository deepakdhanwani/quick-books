import { Product } from '../services/api';

export function calculateProductNet(sellingPrice: number, discount = 0) {
  return Math.max(0, sellingPrice - discount);
}

export function calculateLineAmount(product: Product, quantity: number) {
  return calculateProductNet(product.sellingPrice, product.discount ?? 0) * quantity;
}

export function calculateLinesTotals(lines: { product: Product; quantity: number }[]) {
  return lines.reduce(
    (totals, line) => {
      const qty = line.quantity;
      totals.gross += line.product.sellingPrice * qty;
      totals.discount += (line.product.discount ?? 0) * qty;
      return totals;
    },
    { gross: 0, discount: 0 },
  );
}
