export function calculateLoanDetails(principal: number, interestRate: number, loanPeriodYears: number) {
  // Simple Interest: I = P * N * (R / 100)
  const totalInterest = principal * loanPeriodYears * (interestRate / 100)

  // Total Amount: A = P + I
  const totalAmount = principal + totalInterest

  // Monthly EMI: A / (N * 12)
  const monthlyEmi = totalAmount / (loanPeriodYears * 12)

  return {
    totalInterest,
    totalAmount,
    monthlyEmi: Math.round(monthlyEmi * 100) / 100, // Round to 2 decimal places
  }
}

export function calculateRemainingEmis(remainingBalance: number, monthlyEmi: number): number {
  if (remainingBalance <= 0) return 0
  return Math.ceil(remainingBalance / monthlyEmi)
}
