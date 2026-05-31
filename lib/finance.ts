export const DEFAULT_FINANCE_ASSUMPTIONS = {
  downPaymentPercent: 20,
  annualInterestRate: 12,
  tenureMonths: 36,
} as const;

export type FinanceEstimateInput = {
  listingPrice: number | null | undefined;
  downPaymentPercent?: number;
  annualInterestRate?: number;
  tenureMonths?: number;
};

export type FinanceEstimateResult = {
  listingPrice: number;
  downPaymentPercent: number;
  annualInterestRate: number;
  tenureMonths: number;
  downPaymentAmount: number;
  loanAmount: number;
  estimatedEmi: number;
};

export const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export function calculateFinanceEstimate(input: FinanceEstimateInput): FinanceEstimateResult | null {
  const rawPrice = input.listingPrice;
  if (!rawPrice || !Number.isFinite(rawPrice) || rawPrice <= 0) return null;

  const listingPrice = Math.round(rawPrice);
  const downPaymentPercent = input.downPaymentPercent ?? DEFAULT_FINANCE_ASSUMPTIONS.downPaymentPercent;
  const annualInterestRate = input.annualInterestRate ?? DEFAULT_FINANCE_ASSUMPTIONS.annualInterestRate;
  const tenureMonths = input.tenureMonths ?? DEFAULT_FINANCE_ASSUMPTIONS.tenureMonths;

  if (downPaymentPercent < 0 || downPaymentPercent >= 100 || annualInterestRate <= 0 || tenureMonths <= 0) {
    return null;
  }

  const downPaymentAmount = Math.round((listingPrice * downPaymentPercent) / 100);
  const loanAmount = Math.max(0, listingPrice - downPaymentAmount);
  if (loanAmount === 0) {
    return {
      listingPrice,
      downPaymentPercent,
      annualInterestRate,
      tenureMonths,
      downPaymentAmount,
      loanAmount,
      estimatedEmi: 0,
    };
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  const multiplier = (1 + monthlyRate) ** tenureMonths;
  const emiRaw = (loanAmount * monthlyRate * multiplier) / (multiplier - 1);
  const estimatedEmi = Number.isFinite(emiRaw) ? Math.round(emiRaw) : 0;

  return {
    listingPrice,
    downPaymentPercent,
    annualInterestRate,
    tenureMonths,
    downPaymentAmount,
    loanAmount,
    estimatedEmi,
  };
}
