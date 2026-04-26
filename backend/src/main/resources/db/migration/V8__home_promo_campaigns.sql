CREATE TABLE IF NOT EXISTS home_promo_campaigns (
    campaign_key VARCHAR(64) PRIMARY KEY,
    campaign_type VARCHAR(32) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    cta VARCHAR(200) NOT NULL,
    badge VARCHAR(200),
    expires_at TIMESTAMP WITH TIME ZONE,
    color VARCHAR(300) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_home_promo_sort ON home_promo_campaigns (sort_order, campaign_key);

INSERT INTO home_promo_campaigns (campaign_key, campaign_type, title, description, cta, badge, expires_at, color, sort_order)
VALUES
    ('1', 'first_order', 'İlk Sifarişinə 10% Endirim', 'İndi qeydiyyatdan keç, ilk sifarişində 10% endirim qazan', 'İstifadə Et', 'YENİ', NULL, 'from-[#D90429] to-[#EF476F]', 0),
    ('2', 'referral', 'Dostunu Gətir, 25 AZN Bonus Qazan', 'Hər dəvət etdiyin dost üçün 25 AZN bonus', 'Dəvət Et', 'POPULYAR', NULL, 'from-[#16A34A] to-[#22C55E]', 1),
    ('3', 'limited_time', 'Pro Paket 1 Ay Pulsuz', 'İlk 100 dekorçuya xüsusi təklif. Vaxt tükənir!', 'İndi Al', 'MƏHDUD', NULL, 'from-[#F59E0B] to-[#FBBF24]', 2)
ON CONFLICT (campaign_key) DO NOTHING;
