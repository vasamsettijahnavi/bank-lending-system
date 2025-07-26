import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    // Test database connection by running a simple query
    const customers = db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number }
    const loans = db.prepare("SELECT COUNT(*) as count FROM loans").get() as { count: number }
    const payments = db.prepare("SELECT COUNT(*) as count FROM payments").get() as { count: number }

    return NextResponse.json({
      status: "connected",
      message: "Database is connected and operational",
      data: {
        customers: customers.count,
        loans: loans.count,
        payments: payments.count,
      },
    })
  } catch (error) {
    console.error("Database status check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
