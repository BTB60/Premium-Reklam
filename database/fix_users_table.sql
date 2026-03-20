-- Fix Missing Columns in Users Table
-- Run this on Neon PostgreSQL to add missing columns

-- Add discount_percent column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0;

-- Add monthly_target column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_target DECIMAL(12, 2) DEFAULT 500;

-- Add monthly_sales_total column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_sales_total DECIMAL(12, 2) DEFAULT 0;

-- Add last_login_at column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add status column if not exists (default 'ACTIVE')
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
