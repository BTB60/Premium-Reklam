CREATE TABLE subadmins (
    id UUID PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE subadmin_permissions (
    subadmin_id UUID REFERENCES subadmins(id) ON DELETE CASCADE,
    feature VARCHAR(255),
    permission_level VARCHAR(50),
    PRIMARY KEY (subadmin_id, feature)
);