import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { calculateRemainingEmis } from "@/lib/loan-calculations"

export async function GET(request: NextRequest, { params }: { params: { loan_id: string } }) {
  try {
    const { loan_id } = params
    console.log("🔍 LEDGER API: Fetching ledger for loan:", loan_id)

    const db = getDatabase() as any

    // CRITICAL: Verify database state first
    if (db.verifyPaymentLinkage) {
      const verification = db.verifyPaymentLinkage(loan_id)
      console.log("🔍 LEDGER API: Database verification:", verification)
    }

    // Get loan details
    const loan = db.prepare("SELECT * FROM loans WHERE loan_id = ?").get(loan_id)
    console.log("📋 LEDGER API: Loan found:", loan)

    if (!loan) {
      console.log("❌ LEDGER API: Loan not found:", loan_id)
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // Get all payments for this loan - CRITICAL: Make sure this matches the database query
    const paymentsQuery = `
      SELECT payment_id, amount, payment_type, payment_date
      FROM payments 
      WHERE loan_id = ? 
      ORDER BY payment_date DESC
    `
    console.log("🔍 LEDGER API: Executing payments query:", paymentsQuery, "with param:", loan_id)
    const payments = db.prepare(paymentsQuery).all(loan_id)
    console.log("💳 LEDGER API: Raw payments from database:", payments)

    // Ensure all amounts are numbers
    const processedPayments = payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount),
    }))
    console.log("💳 LEDGER API: Processed payments:", processedPayments)

    // Calculate totals - CRITICAL: Make sure this calculation is correct
    const totalPaid = processedPayments.reduce((sum, payment) => {
      const amount = Number(payment.amount)
      console.log(`   Adding payment: $${amount}`)
      return sum + amount
    }, 0)

    const loanTotalAmount = Number(loan.total_amount)
    const balanceAmount = Math.max(0, loanTotalAmount - totalPaid)
    const monthlyEmi = Number(loan.monthly_emi)
    const emisLeft = calculateRemainingEmis(balanceAmount, monthlyEmi)

    console.log("🧮 LEDGER API: Final calculations:")
    console.log(`   - Loan Total Amount: $${loanTotalAmount}`)
    console.log(`   - Total Paid: $${totalPaid}`)
    console.log(`   - Balance Amount: $${balanceAmount}`)
    console.log(`   - Monthly EMI: $${monthlyEmi}`)
    console.log(`   - EMIs Left: ${emisLeft}`)

    // Format transactions for display
    const transactions = processedPayments.map((payment) => ({
      transaction_id: payment.payment_id,
      date: payment.payment_date,
      amount: Number(payment.amount),
      type: payment.payment_type,
    }))

    const ledgerData = {
      loan_id: loan.loan_id,
      customer_id: loan.customer_id,
      principal: Number(loan.principal_amount),
      total_amount: loanTotalAmount,
      monthly_emi: monthlyEmi,
      amount_paid: totalPaid,
      balance_amount: balanceAmount,
      emis_left: emisLeft,
      transactions,
    }

    console.log("📊 LEDGER API: Final ledger data being returned:", ledgerData)
    return NextResponse.json(ledgerData)
  } catch (error) {
    console.error("❌ LEDGER API: Error fetching ledger:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
