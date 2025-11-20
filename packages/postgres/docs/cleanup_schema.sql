-- remove all schemas that match the pattern
DO $$
DECLARE
    schema_name text;
BEGIN
    FOR schema_name IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname ~ 'test-.*'
          AND nspname NOT IN ('pg_catalog', 'information_schema', 'public') -- Exclude default/system schemas
    LOOP
        EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE;', schema_name);
    END LOOP;
END $$;
