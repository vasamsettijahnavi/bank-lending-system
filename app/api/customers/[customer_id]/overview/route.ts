import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { calculateRemainingEmis } from "@/lib/loan-calculations"

export async function GET(request: NextRequest, { params }: { params: { customer_id: string } }) {
  try {
    const { customer_id } = params
    const db = getDatabase()

    // Check if customer exists and get their loans
    const loans = db
      .prepare(`
      SELECT * FROM loans WHERE customer_id = ?
    `)
      .all(customer_id)

    if (loans.length === 0) {
      return NextResponse.json({ error: "Customer not found or has no loans" }, { status: 404 })
    }

    // Get payment totals for each loan
    const loansWithDetails = loans.map((loan) => {
      const totalPaid = db
        .prepare(`
        SELECT COALESCE(SUM(amount), 0) as total_paid 
        FROM payments 
        WHERE loan_id = ?
      `)
        .get(loan.loan_id) as { total_paid: number }

      const balanceAmount = loan.total_amount - totalPaid.total_paid
      const emisLeft = calculateRemainingEmis(balanceAmount, loan.monthly_emi)
      const totalInterest = loan.total_amount - loan.principal_amount

      return {
        loan_id: loan.loan_id,
        principal: loan.principal_amount,
        total_amount: loan.total_amount,
        total_interest: totalInterest,
        emi_amount: loan.monthly_emi,
        amount_paid: totalPaid.total_paid,
        emis_left: emisLeft,
      }
    })

    return NextResponse.json({
      customer_id,
      total_loans: loans.length,
      loans: loansWithDetails,
    })
  } catch (error) {
    console.error("Error fetching customer overview:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
