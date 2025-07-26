"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, FileText, User, RefreshCw, Bug } from "lucide-react"

export default function BankLendingSystem() {
  const [activeTab, setActiveTab] = useState("create-loan")
  const [loading, setLoading] = useState(false)
  const [loanResult, setLoanResult] = useState<any>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [ledgerResult, setLedgerResult] = useState<any>(null)
  const [overviewResult, setOverviewResult] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [availableLoans, setAvailableLoans] = useState<string[]>([])

  // Form states
  const [loanForm, setLoanForm] = useState({
    customer_id: "",
    loan_amount: "",
    loan_period_years: "",
    interest_rate_yearly: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    loan_id: "",
    amount: "",
    payment_type: "EMI",
  })

  const [ledgerForm, setLedgerForm] = useState({
    loan_id: "",
  })

  const [overviewForm, setOverviewForm] = useState({
    customer_id: "",
  })

  const refreshAvailableLoans = async () => {
    try {
      // Get all customers to find their loans
      const customers = ["CUST001", "CUST002", "CUST003"]
      const allLoans: string[] = []

      for (const customerId of customers) {
        try {
          const response = await fetch(`/api/customers/${customerId}/overview`)
          if (response.ok) {
            const data = await response.json()
            if (data.loans) {
              data.loans.forEach((loan: any) => {
                allLoans.push(loan.loan_id)
              })
            }
          }
        } catch (error) {
          // Customer might not have loans, continue
        }
      }

      setAvailableLoans([...new Set(allLoans)]) // Remove duplicates
      console.log("Available loans updated:", allLoans)
    } catch (error) {
      console.error("Failed to refresh available loans:", error)
    }
  }

  const testPaymentLinkage = async () => {
    try {
      const response = await fetch("/api/debug")
      const data = await response.json()

      console.log("🔍 PAYMENT LINKAGE TEST:")
      console.log("📊 Payment Summary:", data.paymentSummary)

      // Test specific loan
      const testLoanId = "LOAN001"
      console.log(`\n🎯 Testing payments for ${testLoanId}:`)

      if (data.paymentSummary[testLoanId]) {
        console.log(`   ✅ Found ${data.paymentSummary[testLoanId].count} payments`)
        console.log(`   💰 Total amount: $${data.paymentSummary[testLoanId].total}`)
        console.log(`   📋 Payment details:`, data.paymentSummary[testLoanId].payments)
      } else {
        console.log(`   ❌ No payments found for ${testLoanId}`)
      }

      alert("Check console for payment linkage test results!")
    } catch (error) {
      console.error("Payment linkage test failed:", error)
      alert("Payment linkage test failed - check console")
    }
  }

  const verifySpecificLoan = async (loanId: string) => {
    try {
      console.log(`🎯 VERIFYING LOAN: ${loanId}`)

      // First check if loan exists
      const loanResponse = await fetch(`/api/loans/${loanId}/ledger`)
      const loanData = await loanResponse.json()

      console.log(`📊 Loan ledger response:`, loanData)

      // Also check debug data
      const debugResponse = await fetch("/api/debug")
      const debugData = await debugResponse.json()

      console.log(`🐛 Debug data for verification:`, debugData.paymentSummary[loanId])

      alert(`Verification complete for ${loanId} - check console for details`)
    } catch (error) {
      console.error("Verification failed:", error)
    }
  }

  const handleCreateLoan = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: loanForm.customer_id,
          loan_amount: Number.parseFloat(loanForm.loan_amount),
          loan_period_years: Number.parseInt(loanForm.loan_period_years),
          interest_rate_yearly: Number.parseFloat(loanForm.interest_rate_yearly),
        }),
      })
      const data = await response.json()
      setLoanResult(data)

      // Refresh available loans after creating a new one
      if (data.loan_id) {
        await refreshAvailableLoans()
        await checkDatabaseStatus() // Update database status
      }
    } catch (error) {
      setLoanResult({ error: "Failed to create loan" })
    }
    setLoading(false)
  }

  const handleRecordPayment = async () => {
    setLoading(true)
    try {
      console.log(`🎯 RECORDING PAYMENT: $${paymentForm.amount} for loan ${paymentForm.loan_id}`)

      const response = await fetch(`/api/loans/${paymentForm.loan_id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(paymentForm.amount),
          payment_type: paymentForm.payment_type,
        }),
      })
      const data = await response.json()
      setPaymentResult(data)

      console.log(`✅ PAYMENT RESPONSE:`, data)

      // Update database status after payment
      if (data.payment_id) {
        await checkDatabaseStatus()
        // Also test the linkage immediately
        setTimeout(testPaymentLinkage, 1000)
      }
    } catch (error) {
      setPaymentResult({ error: "Failed to record payment" })
    }
    setLoading(false)
  }

  const handleGetLedger = async () => {
    setLoading(true)
    try {
      console.log(`🎯 FETCHING LEDGER for loan ${ledgerForm.loan_id}`)

      const response = await fetch(`/api/loans/${ledgerForm.loan_id}/ledger`)
      const data = await response.json()
      setLedgerResult(data)

      console.log(`📊 LEDGER RESPONSE:`, data)
    } catch (error) {
      setLedgerResult({ error: "Failed to fetch ledger" })
    }
    setLoading(false)
  }

  const handleGetOverview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${overviewForm.customer_id}/overview`)
      const data = await response.json()
      setOverviewResult(data)
    } catch (error) {
      setOverviewResult({ error: "Failed to fetch overview" })
    }
    setLoading(false)
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/status")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ status: "error", message: "Failed to check database status" })
    }
  }

  React.useEffect(() => {
    checkDatabaseStatus()
    refreshAvailableLoans()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bank Lending System</h1>
          <p className="text-gray-600">Manage loans, payments, and customer accounts</p>
        </div>

        {/* Database Status */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      dbStatus?.status === "connected"
                        ? "bg-green-500"
                        : dbStatus?.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span className="font-medium">Database Status: {dbStatus?.status || "checking..."}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={testPaymentLinkage}>
                    <Bug className="w-4 h-4 mr-1" />
                    Test Payments
                  </Button>
                  <Button variant="outline" size="sm" onClick={refreshAvailableLoans}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh Loans
                  </Button>
                  <Button variant="outline" size="sm" onClick={checkDatabaseStatus}>
                    Refresh Status
                  </Button>
                </div>
              </div>
              {dbStatus?.message && <p className="text-sm text-gray-600 mt-2">{dbStatus.message}</p>}
              {dbStatus?.data && (
                <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                  <span>Customers: {dbStatus.data.customers}</span>
                  <span>Loans: {dbStatus.data.loans}</span>
                  <span>Payments: {dbStatus.data.payments}</span>
                </div>
              )}
              {availableLoans.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  <span>Available Loan IDs: {availableLoans.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Forms */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="create-loan" className="text-xs">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Loan
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Payment
                </TabsTrigger>
                <TabsTrigger value="ledger" className="text-xs">
                  <FileText className="w-4 h-4 mr-1" />
                  Ledger
                </TabsTrigger>
                <TabsTrigger value="overview" className="text-xs">
                  <User className="w-4 h-4 mr-1" />
                  Overview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create-loan">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Loan</CardTitle>
                    <CardDescription>Create a new loan for a customer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customer_id">Customer ID</Label>
                      <Select
                        value={loanForm.customer_id}
                        onValueChange={(value) => setLoanForm({ ...loanForm, customer_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUST001">CUST001 - John Doe</SelectItem>
                          <SelectItem value="CUST002">CUST002 - Jane Smith</SelectItem>
                          <SelectItem value="CUST003">CUST003 - Bob Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="loan_amount">Loan Amount ($)</Label>
                      <Input
                        id="loan_amount"
                        type="number"
                        value={loanForm.loan_amount}
                        onChange={(e) => setLoanForm({ ...loanForm, loan_amount: e.target.value })}
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loan_period">Loan Period (Years)</Label>
                      <Input
                        id="loan_period"
                        type="number"
                        value={loanForm.loan_period_years}
                        onChange={(e) => setLoanForm({ ...loanForm, loan_period_years: e.target.value })}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                      <Input
                        id="interest_rate"
                        type="number"
                        step="0.1"
                        value={loanForm.interest_rate_yearly}
                        onChange={(e) => setLoanForm({ ...loanForm, interest_rate_yearly: e.target.value })}
                        placeholder="10.0"
                      />
                    </div>
                    <Button onClick={handleCreateLoan} disabled={loading} className="w-full">
                      {loading ? "Creating..." : "Create Loan"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Record Payment</CardTitle>
                    <CardDescription>Record an EMI or lump sum payment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="payment_loan_id">Loan ID</Label>
                      <Select
                        value={paymentForm.loan_id}
                        onValueChange={(value) => setPaymentForm({ ...paymentForm, loan_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan ID" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOAN001">LOAN001 (John Doe - $100,000)</SelectItem>
                          <SelectItem value="LOAN002">LOAN002 (Jane Smith - $50,000)</SelectItem>
                          {availableLoans
                            .filter((id) => !["LOAN001", "LOAN002"].includes(id))
                            .map((loanId) => (
                              <SelectItem key={loanId} value={loanId}>
                                {loanId} (Newly Created)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_amount">Payment Amount ($)</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_type">Payment Type</Label>
                      <Select
                        value={paymentForm.payment_type}
                        onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMI">EMI</SelectItem>
                          <SelectItem value="LUMP_SUM">Lump Sum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleRecordPayment} disabled={loading} className="w-full">
                      {loading ? "Recording..." : "Record Payment"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ledger">
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Ledger</CardTitle>
                    <CardDescription>View loan details and transaction history</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ledger_loan_id">Loan ID</Label>
                      <Select
                        value={ledgerForm.loan_id}
                        onValueChange={(value) => setLedgerForm({ ...ledgerForm, loan_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan ID" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOAN001">LOAN001 (John Doe - $100,000)</SelectItem>
                          <SelectItem value="LOAN002">LOAN002 (Jane Smith - $50,000)</SelectItem>
                          {availableLoans
                            .filter((id) => !["LOAN001", "LOAN002"].includes(id))
                            .map((loanId) => (
                              <SelectItem key={loanId} value={loanId}>
                                {loanId} (Newly Created)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleGetLedger} disabled={loading} className="w-full">
                      {loading ? "Loading..." : "Get Ledger"}
                    </Button>
                    {ledgerForm.loan_id && (
                      <Button
                        variant="outline"
                        onClick={() => verifySpecificLoan(ledgerForm.loan_id)}
                        className="w-full mt-2"
                      >
                        🔍 Verify This Loan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Overview</CardTitle>
                    <CardDescription>View all loans for a customer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="overview_customer_id">Customer ID</Label>
                      <Select
                        value={overviewForm.customer_id}
                        onValueChange={(value) => setOverviewForm({ ...overviewForm, customer_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUST001">CUST001 - John Doe</SelectItem>
                          <SelectItem value="CUST002">CUST002 - Jane Smith</SelectItem>
                          <SelectItem value="CUST003">CUST003 - Bob Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleGetOverview} disabled={loading} className="w-full">
                      {loading ? "Loading..." : "Get Overview"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>API response will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  let currentResult = null
                  switch (activeTab) {
                    case "create-loan":
                      currentResult = loanResult
                      break
                    case "payment":
                      currentResult = paymentResult
                      break
                    case "ledger":
                      currentResult = ledgerResult
                      break
                    case "overview":
                      currentResult = overviewResult
                      break
                    default:
                      currentResult = null
                  }

                  return currentResult ? (
                    <div className="space-y-4">
                      {currentResult.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 font-medium">Error</p>
                          <p className="text-red-600">{currentResult.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Loan Creation Result */}
                          {currentResult.loan_id && currentResult.total_amount_payable && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-green-800 font-medium mb-2">✅ Loan Created Successfully</p>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <strong>Loan ID:</strong> {currentResult.loan_id}
                                </p>
                                <p>
                                  <strong>Customer ID:</strong> {currentResult.customer_id}
                                </p>
                                <p>
                                  <strong>Total Payable:</strong> ${currentResult.total_amount_payable.toLocaleString()}
                                </p>
                                <p>
                                  <strong>Monthly EMI:</strong> ${currentResult.monthly_emi.toLocaleString()}
                                </p>
                              </div>
                              <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                                💡 This loan is now available in Payment and Ledger tabs!
                              </div>
                            </div>
                          )}

                          {/* Payment Result */}
                          {currentResult.payment_id && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-800 font-medium mb-2">✅ Payment Recorded Successfully</p>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <strong>Payment ID:</strong> {currentResult.payment_id}
                                </p>
                                <p>
                                  <strong>Loan ID:</strong> {currentResult.loan_id}
                                </p>
                                <p>
                                  <strong>Message:</strong> {currentResult.message}
                                </p>
                                <p>
                                  <strong>Remaining Balance:</strong> $
                                  {currentResult.remaining_balance.toLocaleString()}
                                </p>
                                <p>
                                  <strong>EMIs Left:</strong> {currentResult.emis_left}
                                </p>
                              </div>
                              <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                                💡 Check the Ledger tab to see this payment reflected!
                              </div>
                            </div>
                          )}

                          {/* Ledger Result */}
                          {currentResult.transactions !== undefined && (
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="font-medium mb-2">📊 Loan Summary</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <p>
                                    <strong>Principal:</strong> ${currentResult.principal.toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>Total Amount:</strong> ${currentResult.total_amount.toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>Monthly EMI:</strong> ${currentResult.monthly_emi.toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>Amount Paid:</strong> ${currentResult.amount_paid.toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>Balance:</strong> ${currentResult.balance_amount.toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>EMIs Left:</strong> {currentResult.emis_left}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="font-medium mb-2">
                                  💳 Transaction History ({currentResult.transactions.length} payments)
                                </p>
                                {currentResult.transactions.length > 0 ? (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {currentResult.transactions.map((transaction: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex justify-between items-center p-2 bg-white border rounded"
                                      >
                                        <div>
                                          <Badge variant={transaction.type === "EMI" ? "default" : "secondary"}>
                                            {transaction.type}
                                          </Badge>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {new Date(transaction.date).toLocaleDateString()}
                                          </p>
                                          <p className="text-xs text-gray-400">ID: {transaction.transaction_id}</p>
                                        </div>
                                        <p className="font-medium">${transaction.amount.toLocaleString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                    No payments found for this loan yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Overview Result */}
                          {currentResult.loans && (
                            <div className="space-y-4">
                              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-purple-800 font-medium mb-2">Customer Overview</p>
                                <div className="text-sm">
                                  <p>
                                    <strong>Customer ID:</strong> {currentResult.customer_id}
                                  </p>
                                  <p>
                                    <strong>Total Loans:</strong> {currentResult.total_loans}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="font-medium">Loans</p>
                                {currentResult.loans.map((loan: any, index: number) => (
                                  <div key={index} className="p-3 bg-white border rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-medium text-sm">{loan.loan_id}</p>
                                      <Badge variant={loan.emis_left > 0 ? "default" : "secondary"}>
                                        {loan.emis_left > 0 ? "Active" : "Paid Off"}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                      <p>
                                        <strong>Principal:</strong> ${loan.principal.toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>Total:</strong> ${loan.total_amount.toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>EMI:</strong> ${loan.emi_amount.toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>Paid:</strong> ${loan.amount_paid.toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>EMIs Left:</strong> {loan.emis_left}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Select an operation and click the button to see results
                    </p>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sample Data Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🧪 Testing Instructions</CardTitle>
            <CardDescription>Follow these steps to test the payment-ledger integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Sample Data:</p>
                <ul className="space-y-1">
                  <li>• CUST001 - John Doe (has LOAN001)</li>
                  <li>• CUST002 - Jane Smith (has LOAN002)</li>
                  <li>• CUST003 - Bob Johnson (no loans yet)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Existing Loans:</p>
                <ul className="space-y-1">
                  <li>• LOAN001: $100,000 (already has 2 payments)</li>
                  <li>• LOAN002: $50,000 (already has 1 payment)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800 mb-1">🎯 Test Payment-Ledger Integration:</p>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click "Test Payments" to verify existing payment linkages</li>
                <li>2. Record a new payment for LOAN001 (try $5,000)</li>
                <li>3. Immediately check the ledger for LOAN001</li>
                <li>4. Verify the payment appears and balance is updated</li>
                <li>5. Create a new loan and repeat the process</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
