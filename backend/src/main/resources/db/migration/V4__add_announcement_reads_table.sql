CREATE TABLE IF NOT EXISTS announcement_reads (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    announcement_id BIGINT NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_announcement UNIQUE (user_id, announcement_id),
    CONSTRAINT fk_announcement_reads_announcement FOREIGN KEY (announcement_id) 
        REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);