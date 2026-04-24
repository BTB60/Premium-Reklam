-- Müştəri üzrə bonus endirim faizləri (NULL = ümumi sistem ayarı / frontend default)
ALTER TABLE users ADD COLUMN bonus_loyalty_500_percent INTEGER NULL;
ALTER TABLE users ADD COLUMN bonus_loyalty_1000_percent INTEGER NULL;
