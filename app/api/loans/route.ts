import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { calculateLoanDetails } from "@/lib/loan-calculations"
// Simple ID generator for preview
function generateId() {
  return "LOAN" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = body

    // Validate input
    if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (loan_amount <= 0 || loan_period_years <= 0 || interest_rate_yearly < 0) {
      return NextResponse.json({ error: "Invalid input values" }, { status: 400 })
    }

    const db = getDatabase()

    // Check if customer exists
    const customer = db.prepare("SELECT * FROM customers WHERE customer_id = ?").get(customer_id)
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Calculate loan details
    const { totalAmount, monthlyEmi } = calculateLoanDetails(loan_amount, interest_rate_yearly, loan_period_years)

    // Replace uuidv4() with generateId() in the code
    const loanId = generateId()

    // Insert loan into database
    const insertLoan = db.prepare(`
      INSERT INTO loans (
        loan_id, customer_id, principal_amount, total_amount,
        interest_rate, loan_period_years, monthly_emi, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `)

    insertLoan.run(loanId, customer_id, loan_amount, totalAmount, interest_rate_yearly, loan_period_years, monthlyEmi)

    return NextResponse.json(
      {
        loan_id: loanId,
        customer_id,
        total_amount_payable: totalAmount,
        monthly_emi: monthlyEmi,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
