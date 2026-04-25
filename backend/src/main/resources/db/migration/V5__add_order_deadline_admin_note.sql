ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS internal_admin_note TEXT;
