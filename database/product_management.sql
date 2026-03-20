-- ============================================
-- MƏHSUL İDARƏETMƏSİ - SQL KODU
-- Premium Reklam Sistemi
-- ============================================

-- ============================================
-- 1. CƏDVƏLLƏR
-- ============================================

-- Məhsul Kateqoriyaları
CREATE TABLE IF NOT EXISTS product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Məhsullar
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id BIGINT REFERENCES product_categories(id),
    
    -- Təsvir
    description TEXT,
    short_description VARCHAR(500),
    
    -- Ölçü vahidi: m2, linear_m, piece, kg, set
    unit VARCHAR(20) DEFAULT 'm2',
    
    -- Qiymət (AZN)
    purchase_price DECIMAL(12, 2) DEFAULT 0,      -- Alış qiyməti
    sale_price DECIMAL(12, 2) DEFAULT 0,         -- Satış qiyməti
    
    -- Stok
    stock_quantity DECIMAL(12, 2) DEFAULT 0,
    min_stock_level DECIMAL(12, 2) DEFAULT 10,
    
    -- Ölçülər (mm)
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    
    -- Şəkil
    image_url TEXT,
    images JSONB,  -- Çoxşəkilli məhsul üçün
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
    
    -- Xüsusi endirim
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_price DECIMAL(12, 2),
    discount_start DATE,
    discount_end DATE,
    
    -- Admin tənzimləmələri
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Aktiv/Passiv
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Xüsusi Qiymətlər (Müştəriyə xüsusi qiymət)
CREATE TABLE IF NOT EXISTS user_prices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    
    -- Xüsusi qiymət
    custom_price DECIMAL(12, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, product_id)
);

-- ============================================
-- 2. ƏSAS SORĞULAR
-- ============================================

-- Bütün aktiv məhsullar
SELECT 
    p.id,
    p.name,
    p.sku,
    pc.name AS category_name,
    p.sale_price,
    p.stock_quantity,
    p.status
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.is_active = TRUE
ORDER BY p.sort_order, p.name;

-- Stokda azalan məhsullar
SELECT 
    name,
    sku,
    stock_quantity,
    min_stock_level,
    CASE 
        WHEN stock_quantity <= 0 THEN 'BITDI'
        WHEN stock_quantity <= min_stock_level THEN 'ÇOX AZ'
        ELSE 'NORMAL'
    END AS stock_status
FROM products
WHERE is_active = TRUE 
AND stock_quantity <= min_stock_level
ORDER BY stock_quantity;

-- Məhsul axtarışı
SELECT 
    p.id,
    p.name,
    p.sku,
    pc.name AS category,
    p.sale_price,
    p.stock_quantity
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.is_active = TRUE
AND (
    LOWER(p.name) LIKE LOWER('%search_term%')
    OR LOWER(p.sku) LIKE LOWER('%search_term%')
);

-- ============================================
-- 3. MƏHSUL ƏMƏLİYYATLARI
-- ============================================

-- Yeni məhsul əlavə et
INSERT INTO products (name, sku, category_id, unit, purchase_price, sale_price, stock_quantity, min_stock_level, status)
VALUES (
    'Banner PVC',
    'BNR-001',
    1,
    'm2',
    5.00,
    12.00,
    500,
    50,
    'ACTIVE'
);

-- Məhsul qiymətini yenilə
UPDATE products 
SET sale_price = 15.00,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Məhsul stokunu artır/azalt
UPDATE products 
SET stock_quantity = stock_quantity + 100,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Məhsul deaktiv et
UPDATE products 
SET is_active = FALSE,
    status = 'DISCONTINUED',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- ============================================
-- 4. XÜSUSİ QİYMƏT ƏMƏLİYYATLARI
-- ============================================

-- Müştəriyə xüsusi qiymət təyin et
INSERT INTO user_prices (user_id, product_id, custom_price, discount_percent)
VALUES (5, 1, 10.00, 0)
ON CONFLICT (user_id, product_id) 
DO UPDATE SET custom_price = 10.00, updated_at = CURRENT_TIMESTAMP;

-- Müştərinin xüsusi qiymətlərini göstər
SELECT 
    p.name AS product_name,
    p.sale_price AS normal_price,
    up.custom_price AS special_price,
    up.discount_percent
FROM user_prices up
JOIN products p ON up.product_id = p.id
WHERE up.user_id = 5 AND up.is_active = TRUE;

-- Məhsulun bütün xüsusi qiymətlərini göstər
SELECT 
    u.full_name AS user_name,
    u.phone,
    up.custom_price,
    up.discount_percent,
    up.is_active
FROM user_prices up
JOIN users u ON up.user_id = u.id
WHERE up.product_id = 1;

-- ============================================
-- 5. KATEQORİYA ƏMƏLİYYATLARI
-- ============================================

-- Yeni kateqoriya əlavə et
INSERT INTO product_categories (name, slug, description, icon, sort_order)
VALUES ('Bannerlər', 'banners', 'PVC Banner məhsulları', 'flag', 1);

-- Kateqoriyaya görə məhsul sayı
SELECT 
    pc.name AS category,
    COUNT(p.id) AS product_count
FROM product_categories pc
LEFT JOIN products p ON pc.id = p.category_id AND p.is_active = TRUE
GROUP BY pc.id, pc.name
ORDER BY pc.sort_order;

-- ============================================
-- 6. RƏQƏMLƏR VƏ STATİSTİKA
-- ============================================

-- Ümumi məhsul sayı
SELECT COUNT(*) AS total_products FROM products WHERE is_active = TRUE;

-- Stokda olan ümumi dəyər
SELECT 
    SUM(stock_quantity * sale_price) AS total_stock_value
FROM products 
WHERE is_active = TRUE;

-- Ən çox satılan məhsullar (orders-dən)
SELECT 
    p.name,
    p.sku,
    COUNT(oi.id) AS order_count,
    SUM(oi.quantity) AS total_sold
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC
LIMIT 10;

-- ============================================
-- 7. NÜMUNƏ MƏLUMATLAR
-- ============================================

-- Kateqoriyalar
INSERT INTO product_categories (name, slug, description, icon, sort_order) VALUES
('Bannerlər', 'banners', 'PVC Banner və vinil məhsulları', 'flag', 1),
('Yapışqanlı Üzlüklər', 'stickers', 'Dekorativ yapışqanlı üzlüklər', 'sticker', 2),
('Qrafik Dizayn', 'graphic', 'Qrafik dizayn xidmətləri', 'palette', 3),
('Xarici Reklama', 'outdoor', 'Xarici məkanda istifadə üçün', 'building', 4),
('Daxili Reklama', 'indoor', 'Daxili məkanda istifadə üçün', 'home', 5),
('Tədbir və Sərgi', 'events', 'Tədbir və sərgilər üçün', 'calendar', 6);

-- Nümunə Məhsullar
INSERT INTO products (name, sku, category_id, unit, purchase_price, sale_price, stock_quantity, min_stock_level, status) VALUES
('PVC Banner 440', 'BNR-PVC-440', 1, 'm2', 5.00, 15.00, 1000, 100, 'ACTIVE'),
('Vinil Yapışqan 80', 'VNL-80', 2, 'm2', 3.00, 10.00, 2000, 200, 'ACTIVE'),
('Banqo Parça', 'BNG-PARCA', 1, 'm2', 8.00, 25.00, 500, 50, 'ACTIVE'),
('Mesh Banner', 'MSH-BNR', 1, 'm2', 10.00, 30.00, 300, 30, 'ACTIVE'),
('One-Way Vision', 'OWV-001', 2, 'm2', 12.00, 35.00, 400, 40, 'ACTIVE');
