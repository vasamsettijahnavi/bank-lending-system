-- Seed initial data for testing

-- Insert sample customers
INSERT OR IGNORE INTO customers (customer_id, name) VALUES 
('CUST001', 'John Doe'),
('CUST002', 'Jane Smith'),
('CUST003', 'Bob Johnson');

-- Insert sample loans
INSERT OR IGNORE INTO loans (
    loan_id, customer_id, principal_amount, total_amount, 
    interest_rate, loan_period_years, monthly_emi, status
) VALUES 
('LOAN001', 'CUST001', 100000.00, 120000.00, 10.00, 2, 5000.00, 'ACTIVE'),
('LOAN002', 'CUST002', 50000.00, 57500.00, 7.50, 2, 2395.83, 'ACTIVE');

-- Insert sample payments
INSERT OR IGNORE INTO payments (payment_id, loan_id, amount, payment_type) VALUES 
('PAY001', 'LOAN001', 5000.00, 'EMI'),
('PAY002', 'LOAN001', 5000.00, 'EMI'),
('PAY003', 'LOAN002', 2395.83, 'EMI');
