import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase() as any

    // Get all data from mock database
    const allData = db.getAllData()

    // Create payment summary by loan
    const paymentSummary: Record<string, any> = {}
    allData.payments.forEach((payment: any) => {
      if (!paymentSummary[payment.loan_id]) {
        paymentSummary[payment.loan_id] = {
          count: 0,
          total: 0,
          payments: [],
        }
      }
      paymentSummary[payment.loan_id].count++
      paymentSummary[payment.loan_id].total += Number(payment.amount)
      paymentSummary[payment.loan_id].payments.push({
        id: payment.payment_id,
        amount: payment.amount,
        type: payment.payment_type,
        date: payment.payment_date,
      })
    })

    console.log("🐛 DEBUG - All Database Data:")
    console.log("👥 Customers:", allData.customers)
    console.log("🏦 Loans:", allData.loans)
    console.log("💳 Payments:", allData.payments)
    console.log("📊 Payment Summary by Loan:", paymentSummary)

    return NextResponse.json({
      status: "success",
      data: allData,
      paymentSummary,
      summary: {
        customers: allData.customers.length,
        loans: allData.loans.length,
        payments: allData.payments.length,
        loanIds: allData.loans.map((l: any) => l.loan_id),
      },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      { status: "error", message: "Debug failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
