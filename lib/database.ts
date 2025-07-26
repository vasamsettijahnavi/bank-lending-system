// Mock database implementation for preview
class MockDatabase {
  private data = {
    customers: [
      { customer_id: "CUST001", name: "John Doe", created_at: new Date().toISOString() },
      { customer_id: "CUST002", name: "Jane Smith", created_at: new Date().toISOString() },
      { customer_id: "CUST003", name: "Bob Johnson", created_at: new Date().toISOString() },
    ],
    loans: [
      {
        loan_id: "LOAN001",
        customer_id: "CUST001",
        principal_amount: 100000,
        total_amount: 120000,
        interest_rate: 10,
        loan_period_years: 2,
        monthly_emi: 5000,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
      {
        loan_id: "LOAN002",
        customer_id: "CUST002",
        principal_amount: 50000,
        total_amount: 57500,
        interest_rate: 7.5,
        loan_period_years: 2,
        monthly_emi: 2395.83,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      },
    ],
    payments: [
      {
        payment_id: "PAY001",
        loan_id: "LOAN001",
        amount: 5000,
        payment_type: "EMI",
        payment_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        payment_id: "PAY002",
        loan_id: "LOAN001",
        amount: 5000,
        payment_type: "EMI",
        payment_date: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      },
      {
        payment_id: "PAY003",
        loan_id: "LOAN002",
        amount: 2395.83,
        payment_type: "EMI",
        payment_date: new Date().toISOString(),
      },
    ],
  }

  prepare(query: string) {
    return {
      get: (param?: any) => {
        console.log("🔍 GET Query:", query, "Param:", param)

        if (query.includes("SELECT * FROM customers WHERE customer_id = ?")) {
          const result = this.data.customers.find((c) => c.customer_id === param)
          console.log("👤 Customer found:", result)
          return result
        }

        if (query.includes("SELECT * FROM loans WHERE loan_id = ?")) {
          const result = this.data.loans.find((l) => l.loan_id === param)
          console.log("🏦 Loan found:", result)
          return result
        }

        if (query.includes("SELECT COUNT(*) as count FROM customers")) {
          return { count: this.data.customers.length }
        }
        if (query.includes("SELECT COUNT(*) as count FROM loans")) {
          return { count: this.data.loans.length }
        }
        if (query.includes("SELECT COUNT(*) as count FROM payments")) {
          return { count: this.data.payments.length }
        }

        // CRITICAL FIX: This query is used by payment API to calculate total paid
        if (query.includes("SELECT COALESCE(SUM(amount), 0) as total_paid")) {
          const loanId = param
          console.log(`💰 PAYMENT SUM CALCULATION for loan: "${loanId}"`)
          console.log(
            `💰 All payments in database:`,
            this.data.payments.map((p) => ({ id: p.payment_id, loan_id: p.loan_id, amount: p.amount })),
          )

          const paymentsForLoan = this.data.payments.filter((p) => {
            const match = p.loan_id === loanId
            console.log(`   Checking payment ${p.payment_id}: loan_id="${p.loan_id}" === "${loanId}" ? ${match}`)
            return match
          })

          const total = paymentsForLoan.reduce((sum, p) => sum + Number(p.amount), 0)
          console.log(`💰 Found ${paymentsForLoan.length} payments for loan ${loanId}:`, paymentsForLoan)
          console.log(`💰 Total amount calculated: $${total}`)
          return { total_paid: total }
        }
        return null
      },

      all: (param?: any) => {
        console.log("📋 ALL Query:", query, "Param:", param)

        if (query.includes("SELECT * FROM loans WHERE customer_id = ?")) {
          const result = this.data.loans.filter((l) => l.customer_id === param)
          console.log(`🏦 Loans for customer ${param}:`, result)
          return result
        }

        // CRITICAL FIX: Match the exact ledger query format
        if (
          query.includes("SELECT payment_id, amount, payment_type, payment_date FROM payments") &&
          query.includes("WHERE loan_id = ?") &&
          query.includes("ORDER BY payment_date DESC")
        ) {
          const loanId = param
          const paymentsForLoan = this.data.payments.filter((p) => p.loan_id === loanId)
          console.log(`💳 LEDGER QUERY - Searching for payments with loan_id: "${loanId}"`)
          console.log(
            `💳 LEDGER QUERY - All payments in database:`,
            this.data.payments.map((p) => ({ id: p.payment_id, loan_id: p.loan_id, amount: p.amount })),
          )
          console.log(`💳 LEDGER QUERY - Filtered payments for loan ${loanId}:`, paymentsForLoan)

          const formattedPayments = paymentsForLoan.map((p) => ({
            payment_id: p.payment_id,
            amount: Number(p.amount),
            payment_type: p.payment_type,
            payment_date: p.payment_date,
          }))

          console.log(`💳 LEDGER QUERY - Formatted payments being returned:`, formattedPayments)
          return formattedPayments
        }

        return []
      },

      run: (...params: any[]) => {
        console.log("▶️ RUN Query:", query)
        console.log("📝 RUN Params:", params)

        // Handle loan insertion
        if (query.includes("INSERT INTO loans")) {
          const [loanId, customerId, principalAmount, totalAmount, interestRate, loanPeriodYears, monthlyEmi, status] =
            params
          const newLoan = {
            loan_id: loanId,
            customer_id: customerId,
            principal_amount: Number(principalAmount),
            total_amount: Number(totalAmount),
            interest_rate: Number(interestRate),
            loan_period_years: Number(loanPeriodYears),
            monthly_emi: Number(monthlyEmi),
            status: status || "ACTIVE",
            created_at: new Date().toISOString(),
          }

          this.data.loans.push(newLoan)
          console.log("✅ NEW LOAN ADDED:", newLoan)
          console.log("📊 TOTAL LOANS NOW:", this.data.loans.length)
          return { changes: 1, lastInsertRowid: this.data.loans.length }
        }

        // CRITICAL FIX: Handle payment insertion properly
        if (query.includes("INSERT INTO payments")) {
          const [paymentId, loanId, amount, paymentType] = params

          // Verify the loan exists first
          const loanExists = this.data.loans.find((l) => l.loan_id === loanId)
          if (!loanExists) {
            console.error("❌ PAYMENT ERROR: Loan not found:", loanId)
            return { changes: 0 }
          }

          const newPayment = {
            payment_id: paymentId,
            loan_id: loanId,
            amount: Number(amount),
            payment_type: paymentType,
            payment_date: new Date().toISOString(),
          }

          this.data.payments.push(newPayment)
          console.log("✅ NEW PAYMENT ADDED:", newPayment)
          console.log("📊 TOTAL PAYMENTS NOW:", this.data.payments.length)

          // Show all payments for this loan
          const allPaymentsForLoan = this.data.payments.filter((p) => p.loan_id === loanId)
          console.log(`💳 ALL PAYMENTS FOR LOAN ${loanId}:`, allPaymentsForLoan)

          return { changes: 1, lastInsertRowid: this.data.payments.length }
        }

        // Handle loan status update
        if (query.includes("UPDATE loans SET status")) {
          const [status, loanId] = params
          const loan = this.data.loans.find((l) => l.loan_id === loanId)
          if (loan) {
            loan.status = status
            console.log("✅ LOAN STATUS UPDATED:", { loanId, status })
          }
          return { changes: 1 }
        }

        return { changes: 1 }
      },
    }
  }

  exec(query: string) {
    console.log("🔧 EXEC Query:", query)
    return true
  }

  pragma(setting: string) {
    console.log("⚙️ PRAGMA:", setting)
    return true
  }

  // Helper method to get current state (for debugging)
  getState() {
    return {
      customers: this.data.customers.length,
      loans: this.data.loans.length,
      payments: this.data.payments.length,
      loanIds: this.data.loans.map((l) => l.loan_id),
      paymentsByLoan: this.data.payments.reduce(
        (acc, p) => {
          acc[p.loan_id] = (acc[p.loan_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }

  // Debug method to get all data
  getAllData() {
    return {
      customers: this.data.customers,
      loans: this.data.loans,
      payments: this.data.payments,
    }
  }

  // Method to get payments for a specific loan (for debugging)
  getPaymentsForLoan(loanId: string) {
    return this.data.payments.filter((p) => p.loan_id === loanId)
  }

  // Method to verify payment-loan linkage
  verifyPaymentLinkage(loanId: string) {
    console.log(`🔍 VERIFICATION for loan: "${loanId}"`)
    console.log(
      `🔍 All loans:`,
      this.data.loans.map((l) => ({ id: l.loan_id, customer: l.customer_id })),
    )
    console.log(
      `🔍 All payments:`,
      this.data.payments.map((p) => ({ id: p.payment_id, loan_id: p.loan_id, amount: p.amount })),
    )

    const loan = this.data.loans.find((l) => l.loan_id === loanId)
    const payments = this.data.payments.filter((p) => p.loan_id === loanId)

    console.log(`🔍 Loan found:`, loan ? "YES" : "NO", loan)
    console.log(`🔍 Payments found:`, payments.length, payments)

    return {
      loanExists: !!loan,
      paymentCount: payments.length,
      totalPaid: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }
  }
}

let db: MockDatabase

export function getDatabase() {
  if (!db) {
    db = new MockDatabase()
    console.log("🚀 Mock database connected successfully")
    console.log("📊 Initial state:", db.getState())
  }
  return db
}

export interface Customer {
  customer_id: string
  name: string
  created_at: string
}

export interface Loan {
  loan_id: string
  customer_id: string
  principal_amount: number
  total_amount: number
  interest_rate: number
  loan_period_years: number
  monthly_emi: number
  status: string
  created_at: string
}

export interface Payment {
  payment_id: string
  loan_id: string
  amount: number
  payment_type: "EMI" | "LUMP_SUM"
  payment_date: string
}

export interface LoanWithPayments extends Loan {
  amount_paid: number
  balance_amount: number
  emis_left: number
  transactions: Array<{
    transaction_id: string
    date: string
    amount: number
    type: string
  }>
}
