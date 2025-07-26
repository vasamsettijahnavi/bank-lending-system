 Bank Lending System

A comprehensive full-stack banking application for managing loans, payments, and customer accounts. Built with Next.js, TypeScript, and a mock database for demonstration purposes.

## 🏦 Features

### Core Functionality
- **Loan Management**: Create new loans with customizable terms
- **Payment Processing**: Record EMI and lump sum payments
- **Ledger System**: View detailed transaction history and loan status
- **Customer Overview**: Comprehensive view of all customer loans
- **Real-time Calculations**: Automatic balance and EMI calculations

### Technical Features
- **Mock Database**: In-memory database for preview and testing
- **RESTful APIs**: Clean API endpoints for all operations
- **Real-time Updates**: Immediate reflection of changes across tabs
- **Responsive Design**: Mobile-friendly interface
- **Debug Tools**: Built-in debugging and verification tools

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd bank-lending-system
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 System Overview

### Database Schema

#### Customers Table
\`\`\`sql
CREATE TABLE customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### Loans Table
\`\`\`sql
CREATE TABLE loans (
    loan_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    loan_period_years INTEGER NOT NULL,
    monthly_emi DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### Payments Table
\`\`\`sql
CREATE TABLE payments (
    payment_id TEXT PRIMARY KEY,
    loan_id TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('EMI', 'LUMP_SUM')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🎯 API Endpoints

### Loans
- `POST /api/loans` - Create a new loan
- `GET /api/loans/[loan_id]/ledger` - Get loan ledger and transaction history

### Payments
- `POST /api/loans/[loan_id]/payments` - Record a payment for a loan

### Customers
- `GET /api/customers/[customer_id]/overview` - Get customer overview with all loans

### System
- `GET /api/status` - Check database connection status
- `GET /api/debug` - Get debug information (development only)

## 🧮 Loan Calculations

The system uses **Simple Interest** calculations:

### Formulas Used
- **Interest**: `I = P × N × (R / 100)`
- **Total Amount**: `A = P + I`
- **Monthly EMI**: `EMI = A / (N × 12)`
- **Remaining EMIs**: `ceil(Remaining Balance / Monthly EMI)`

Where:
- P = Principal Amount
- N = Loan Period (years)
- R = Interest Rate (%)
- A = Total Amount

### Example
For a loan of $100,000 at 10% interest for 2 years:
- Interest = $100,000 × 2 × (10/100) = $20,000
- Total Amount = $100,000 + $20,000 = $120,000
- Monthly EMI = $120,000 / (2 × 12) = $5,000

## 🧪 Testing the System

### Sample Data
The system comes pre-loaded with sample data:

#### Customers
- **CUST001** - John Doe
- **CUST002** - Jane Smith  
- **CUST003** - Bob Johnson

#### Existing Loans
- **LOAN001** (CUST001): $100,000 loan with existing payments
- **LOAN002** (CUST002): $50,000 loan with existing payments

### Test Workflow

1. **Create a New Loan**
   - Select CUST003 (Bob Johnson)
   - Enter loan amount: $10,000
   - Set period: 2 years
   - Set interest rate: 10%

2. **Record Payments**
   - Select the newly created loan
   - Record EMI payments or lump sum payments
   - Verify payment confirmation

3. **Check Ledger**
   - View the loan ledger
   - Verify payment history
   - Check updated balance and remaining EMIs

4. **Customer Overview**
   - View all loans for a customer
   - See summary of all loan statuses

### Debug Tools

- **Test Payments Button**: Verify payment-loan linkages
- **Refresh Loans Button**: Update available loan list
- **Verify This Loan Button**: Debug specific loan data
- **Console Logging**: Detailed operation logs

## 🏗️ Project Structure

\`\`\`
bank-lending-system/
├── app/
│   ├── api/
│   │   ├── customers/[customer_id]/overview/route.ts
│   │   ├── loans/
│   │   │   ├── route.ts
│   │   │   └── [loan_id]/
│   │   │       ├── ledger/route.ts
│   │   │       └── payments/route.ts
│   │   ├── status/route.ts
│   │   └── debug/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── database.ts
│   └── loan-calculations.ts
├── scripts/
│   ├── 01-create-tables.sql
│   └── 02-seed-data.sql
├── components/ui/
│   └── [shadcn components]
└── README.md
\`\`\`

## 🔧 Configuration

### Environment Variables
For production deployment, you may need:
\`\`\`env
DATABASE_URL=your_database_connection_string
NEXT_PUBLIC_API_URL=your_api_base_url
\`\`\`

### Database Migration
The SQL scripts in the `scripts/` folder can be used to set up a real database:
1. Run `01-create-tables.sql` to create the schema
2. Run `02-seed-data.sql` to insert sample data

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Docker containers

## 🛠️ Development

### Adding New Features
1. **API Routes**: Add new routes in `app/api/`
2. **Database Operations**: Extend `lib/database.ts`
3. **UI Components**: Add components in `components/`
4. **Calculations**: Extend `lib/loan-calculations.ts`

### Mock Database vs Real Database
Currently using a mock in-memory database. To switch to a real database:
1. Replace `lib/database.ts` with actual database connection
2. Use an ORM like Prisma or raw SQL queries
3. Update environment variables

## 📝 API Documentation

### Create Loan
```http
POST /api/loans
Content-Type: application/json

{
  "customer_id": "CUST001",
  "loan_amount": 100000,
  "loan_period_years": 2,
  "interest_rate_yearly": 10.0
}
