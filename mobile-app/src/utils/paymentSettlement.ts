import { appAlert } from './appAlert';
import { formatCurrency } from './saleAmounts';

export type PaymentSettlementType = 'FULL' | 'PARTIAL' | 'SETTLEMENT';

type SettlementPromptOptions = {
  paymentAmount: number;
  pendingAmount: number;
  documentLabel: string;
  onChoose: (settlementType: PaymentSettlementType) => void;
};

export function resolvePaymentSettlementType({
  paymentAmount,
  pendingAmount,
  documentLabel,
  onChoose,
}: SettlementPromptOptions) {
  if (paymentAmount >= pendingAmount - 0.005) {
    onChoose('FULL');
    return;
  }

  const shortfall = pendingAmount - paymentAmount;

  appAlert(
    'Payment type',
    `You entered ${formatCurrency(paymentAmount)} but ${formatCurrency(pendingAmount)} is pending on this ${documentLabel}. The remaining ${formatCurrency(shortfall)} can be recorded as partial payment or written off on settlement.`,
    [
      {
        text: 'Partial Payment',
        onPress: () => onChoose('PARTIAL'),
      },
      {
        text: `Settle ${documentLabel}`,
        onPress: () => onChoose('SETTLEMENT'),
      },
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}
