#!/usr/bin/env bash
set -e

# This script initializes the PostgreSQL database with proper credential separation
# for migration (POSTGRES_USER - superuser) and runtime (DATABASE_USER - least privilege).
#
# Environment variables (from docker-compose.yml):
#   POSTGRES_USER - PostgreSQL superuser used for migrations (DDL + DML)
#   DATABASE_NAME - Application database name
#   DATABASE_USER - Runtime application user (least privilege - DML only)
#   DATABASE_PASSWORD - Password for runtime user

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DATABASE_NAME" <<-EOSQL
	-- Create runtime user (least privilege - DML only)
	CREATE USER ${DATABASE_USER} WITH PASSWORD '${DATABASE_PASSWORD}';
	
	-- Grant database connection privileges
	GRANT CONNECT ON DATABASE ${DATABASE_NAME} TO ${DATABASE_USER};
	
	-- Grant schema usage
	GRANT USAGE ON SCHEMA public TO ${DATABASE_USER};
	
	-- Runtime user: DML only (SELECT, INSERT, UPDATE, DELETE) on all existing tables
	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DATABASE_USER};
	
	-- Runtime user: Usage on sequences (for auto-increment columns)
	GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DATABASE_USER};
	
	-- Runtime user: Execute functions (if any)
	GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${DATABASE_USER};
	
	-- Set default privileges for future tables created by POSTGRES_USER (important!)
	-- This ensures tables created by migrations are accessible by runtime user
	ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public 
		GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DATABASE_USER};
	
	ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public 
		GRANT USAGE, SELECT ON SEQUENCES TO ${DATABASE_USER};
	
	ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public 
		GRANT EXECUTE ON FUNCTIONS TO ${DATABASE_USER};
	
	-- Display user roles for verification
	SELECT 'Database initialization complete' AS status;
	SELECT 'Runtime user: ${DATABASE_USER} (DML only - no DDL rights)' AS info;
	SELECT 'Migration user: ${POSTGRES_USER} (superuser - full DDL + DML rights)' AS info;
EOSQL

echo "✓ Database initialized with credential separation"
echo "  - Runtime user: ${DATABASE_USER} (SELECT, INSERT, UPDATE, DELETE only)"
echo "  - Migration user: ${POSTGRES_USER} (superuser - CREATE, ALTER, DROP, + DML)"
