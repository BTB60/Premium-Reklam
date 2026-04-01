-- Create Admin User
-- NOTE: Run this AFTER running fix_users_table.sql
-- Password will be encoded by backend DataLoader on next startup

-- First check if admin exists
DELETE FROM users WHERE username = 'admin';

INSERT INTO users (
    username, 
    password_hash, 
    full_name, 
    phone,
    email,
    role, 
    status, 
    monthly_target, 
    monthly_sales_total, 
    discount_percent,
    created_at, 
    updated_at
) 
VALUES (
    'admin',
    'TEMPORARY_HASH_REPLACE_BY_BACKEND', -- Backend will replace this
    'Administrator',
    '0500000000',
    'admin@premiumreklam.az',
    'ADMIN',
    'ACTIVE',
    500,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
