-- ============================================
-- Premium Reklam Database Schema
-- PostgreSQL
-- Generated for PremiumReklam Project
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Role: ADMIN, DECORCU, DECORATOR, VENDOR
    role VARCHAR(50) DEFAULT 'DECORATOR' NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile
    avatar_url TEXT,
    company_name VARCHAR(255),
    
    -- Level & Financial
    level INTEGER DEFAULT 1,
    total_orders INTEGER DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    monthly_sales DECIMAL(12, 2) DEFAULT 0,
    monthly_stats JSONB DEFAULT '{}',
    
    -- Debt Control
    debt_limit DECIMAL(12, 2) DEFAULT 1000,
    current_debt DECIMAL(12, 2) DEFAULT 0,
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE,
    referred_by BIGINT REFERENCES users(id),
    
    -- Commission
    commission_rate DECIMAL(5, 2) DEFAULT 15.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(80) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    
    -- Unit: M2 (square meter), PIECE, METER
    unit VARCHAR(20) DEFAULT 'M2' NOT NULL,
    
    -- Pricing
    purchase_price DECIMAL(12, 2) DEFAULT 0,
    sale_price DECIMAL(12, 2) DEFAULT 0,
    
    -- Stock
    stock_quantity DECIMAL(12, 2) DEFAULT 0,
    min_stock_level DECIMAL(12, 2) DEFAULT 0,
    
    -- Dimensions
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    
    -- Status: ACTIVE, INACTIVE
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    
    -- Creator
    created_by BIGINT REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. USER PRICES TABLE (Custom prices per user)
-- ============================================
CREATE TABLE user_prices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Custom price for this user
    custom_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Discount percentage
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Active status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(user_id, product_id)
);

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer Info
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30),
    customer_whatsapp VARCHAR(30),
    customer_address TEXT,
    
    -- User (who created the order)
    user_id BIGINT REFERENCES users(id),
    
    -- Status: PENDING, APPROVED, DESIGN, PRINTING, PRODUCTION, READY, DELIVERING, COMPLETED, CANCELLED
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    
    -- Financial
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment
    payment_method VARCHAR(30) DEFAULT 'CASH' NOT NULL, -- CASH, CARD, TRANSFER
    is_credit BOOLEAN DEFAULT FALSE,
    
    -- Note
    note TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    
    -- Product name (snapshot)
    product_name VARCHAR(150) NOT NULL,
    
    -- Unit: M2, PIECE, METER
    unit VARCHAR(20) DEFAULT 'M2' NOT NULL,
    
    -- Measurements
    quantity DECIMAL(12, 2) DEFAULT 1,
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    area DECIMAL(10, 2) DEFAULT 0,
    
    -- Pricing
    unit_price DECIMAL(12, 2) DEFAULT 0,
    line_total DECIMAL(12, 2) DEFAULT 0,
    
    -- Note
    note TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    user_id BIGINT REFERENCES users(id),
    
    amount DECIMAL(12, 2) NOT NULL,
    method VARCHAR(50) NOT NULL, -- CASH, CARD, TRANSFER, BONUS
    
    transaction_reference VARCHAR(255),
    receipt_url TEXT,
    
    -- Status: PENDING, COMPLETED, FAILED, REFUNDED
    status VARCHAR(50) DEFAULT 'COMPLETED',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    
    note TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type: ORDER_STATUS, PAYMENT, BONUS, SYSTEM
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Assignment
    decorator_id BIGINT NOT NULL REFERENCES users(id),
    created_by VARCHAR(100),
    
    -- Priority: LOW, MEDIUM, HIGH, URGENT
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    
    -- Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    status VARCHAR(20) DEFAULT 'PENDING',
    
    deadline TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_user_prices_user ON user_prices(user_id);
CREATE INDEX idx_user_prices_product ON user_prices(product_id);
CREATE INDEX idx_user_prices_active ON user_prices(user_id, product_id, is_active);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_tasks_decorator ON tasks(decorator_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================
-- TRIGGERS (Auto-update updated_at)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products trigger
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Prices trigger
CREATE TRIGGER update_user_prices_updated_at 
    BEFORE UPDATE ON user_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders trigger
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tasks trigger
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Settings trigger
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT SETTINGS DATA
-- ============================================

INSERT INTO settings (key, value) VALUES
    ('company_name', 'Premium Reklam'),
    ('unit_price_per_sqm', '15.00'),
    ('monthly_bonus_500', '5'),
    ('monthly_bonus_1000', '10'),
    ('banner_discount', '0'),
    ('vinyl_discount', '0'),
    ('poster_discount', '0'),
    ('canvas_discount', '0'),
    ('oracal_discount', '0'),
    ('min_order_amount', '10'),
    ('currency', 'AZN'),
    ('support_phone', '+994 50 000 00 00'),
    ('support_email', 'info@premiumreklam.az');

-- ============================================
-- SAMPLE DATA (Admin User)
-- ============================================

INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsV7oFvxvfFPgK4q.C', 'Administrator', 'ADMIN', TRUE);
-- Password: admin123

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================

INSERT INTO products (name, sku, category, description, unit, purchase_price, sale_price, status) VALUES
    ('Vinil - Standart', 'VIN-001', 'Vinil', 'Standart vinil materialı', 'M2', 5.00, 15.00, 'ACTIVE'),
    ('Vinil - Premium', 'VIN-002', 'Vinil', 'Premium keyfiyyətli vinil', 'M2', 8.00, 20.00, 'ACTIVE'),
    ('Banner', 'BAN-001', 'Banner', 'Banner materialı', 'M2', 4.00, 12.00, 'ACTIVE'),
    ('Banner - Güclü', 'BAN-002', 'Banner', 'Güclü banner materialı', 'M2', 6.00, 18.00, 'ACTIVE'),
    ('Canvas', 'CAN-001', 'Canvas', 'Canvas tablo materialı', 'M2', 15.00, 35.00, 'ACTIVE'),
    ('Poster', 'PST-001', 'Poster', 'Poster çapı', 'M2', 2.00, 8.00, 'ACTIVE'),
    ('Oracal', 'ORA-001', 'Oracal', 'Oracal yapışqanlı film', 'M2', 10.00, 25.00, 'ACTIVE'),
    ('Qrafika Dizayn', 'SRV-001', 'Xidmət', 'Peşəkar qrafika dizaynı', 'PIECE', 10.00, 30.00, 'ACTIVE');

-- ============================================
-- END OF SCHEMA
-- ============================================
