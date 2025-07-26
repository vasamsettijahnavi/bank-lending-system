import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { calculateRemainingEmis } from "@/lib/loan-calculations"
// Simple ID generator for preview
function generateId() {
  return "PAY" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

export async function POST(request: NextRequest, { params }: { params: { loan_id: string } }) {
  try {
    const { loan_id } = params
    const body = await request.json()
    const { amount, payment_type } = body

    // Validate input
    if (!amount || !payment_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Payment amount must be positive" }, { status: 400 })
    }

    if (!["EMI", "LUMP_SUM"].includes(payment_type)) {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 })
    }

    const db = getDatabase()

    // Check if loan exists
    const loan = db.prepare("SELECT * FROM loans WHERE loan_id = ?").get(loan_id)
    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    // Calculate current balance
    const totalPaid = db
      .prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid 
      FROM payments 
      WHERE loan_id = ?
    `)
      .get(loan_id) as { total_paid: number }

    const remainingBalance = loan.total_amount - totalPaid.total_paid - amount

    if (remainingBalance < 0) {
      return NextResponse.json({ error: "Payment amount exceeds remaining balance" }, { status: 400 })
    }

    // Insert payment
    const paymentId = generateId()
    const insertPayment = db.prepare(`
      INSERT INTO payments (payment_id, loan_id, amount, payment_type)
      VALUES (?, ?, ?, ?)
    `)

    insertPayment.run(paymentId, loan_id, amount, payment_type)

    // Calculate remaining EMIs
    const emisLeft = calculateRemainingEmis(remainingBalance, loan.monthly_emi)

    // Update loan status if fully paid
    if (remainingBalance === 0) {
      db.prepare("UPDATE loans SET status = ? WHERE loan_id = ?").run("PAID_OFF", loan_id)
    }

    return NextResponse.json({
      payment_id: paymentId,
      loan_id,
      message: "Payment recorded successfully.",
      remaining_balance: remainingBalance,
      emis_left: emisLeft,
    })
  } catch (error) {
    console.error("Error recording payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
