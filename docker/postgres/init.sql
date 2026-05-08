-- Smart Diagnostic Center - PostgreSQL Init Script
-- This runs automatically when the postgres container first starts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fast text search

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE smart_diagnostic_center TO sdc_user;
