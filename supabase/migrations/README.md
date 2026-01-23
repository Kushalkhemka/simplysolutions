# Database Migrations

## Migration Files

### 20260123_add_foreign_key_indexes.sql
Adds missing indexes for foreign key columns to improve performance:
- `license_replacement_requests.new_license_key_id`
- `license_replacement_requests.original_license_key_id`
- `license_replacement_requests.reviewed_by`
- `multi_fsn_orders.processed_by`

### 20260123_remove_unused_indexes.sql
Removes 71 unused indexes to reduce storage overhead and improve write performance.

### 20260123_fix_rls_performance.sql
Optimizes RLS policies on `multi_fsn_orders` table by wrapping `auth.uid()` calls in subqueries to prevent re-evaluation for each row.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `20260123_add_foreign_key_indexes.sql`
5. Click **Run** to execute
6. Repeat for `20260123_remove_unused_indexes.sql`

### Option 2: Supabase CLI (For Development/Testing)

```bash
# Make sure you're in the project directory
cd /Users/kushalkhemka/Desktop/ECOM/simplysolutions

# Apply the foreign key indexes migration
supabase db push

# Or apply manually via psql
psql <your-database-connection-string> < supabase/migrations/20260123_add_foreign_key_indexes.sql
psql <your-database-connection-string> < supabase/migrations/20260123_remove_unused_indexes.sql
```

## Pre-Migration Checklist

- [ ] **Backup your database** (Critical!)
- [ ] Test migrations in development/staging environment first
- [ ] Plan to run during low-traffic period
- [ ] Have rollback plan ready

## Post-Migration Verification

After applying the migrations:

1. **Run Supabase Linter Again**
   - Go to Database → Linter in Supabase dashboard
   - Verify "Unindexed foreign keys" issues are resolved
   - Verify "Unused Index" warnings are cleared

2. **Check Index Creation**
   ```sql
   -- Verify new indexes exist
   SELECT indexname, tablename 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND indexname LIKE '%license_replacement%' 
      OR indexname LIKE '%multi_fsn_orders_processed_by%';
   ```

3. **Monitor Performance**
   - Watch query performance for 24-48 hours
   - Check for any slow query logs
   - Monitor application error logs

## Rollback

If you need to undo these changes:

### Rollback Foreign Key Indexes
```sql
DROP INDEX IF EXISTS public.idx_license_replacement_requests_new_license_key;
DROP INDEX IF EXISTS public.idx_license_replacement_requests_original_license_key;
DROP INDEX IF EXISTS public.idx_license_replacement_requests_reviewed_by;
DROP INDEX IF EXISTS public.idx_multi_fsn_orders_processed_by;
```

### Recreate Specific Unused Indexes
If you discover a dropped index was needed, you can recreate it. Example:
```sql
CREATE INDEX idx_orders_user ON public.orders(user_id);
```

## Notes

- All migrations use `IF EXISTS` / `IF NOT EXISTS` to be idempotent
- Safe to run multiple times without errors
- Migrations are in separate files for modular application
