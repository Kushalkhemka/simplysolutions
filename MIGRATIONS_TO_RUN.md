# Database Migration SQL Scripts

## Migration 1: Add FSN to Products Table

```sql
-- Add FSN column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS fsn VARCHAR(50);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_fsn ON products(fsn);

-- Add comment
COMMENT ON COLUMN products.fsn IS 'Amazon FSN code for activation system mapping';
```

## Migration 2: Add Secret Codes to Order Items

```sql
-- Add secret_codes array column
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS secret_codes TEXT[];

-- Add product_fsn column
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_fsn VARCHAR(50);

-- Add comments
COMMENT ON COLUMN order_items.secret_codes IS 'Array of secret codes for activation - one per quantity unit';
COMMENT ON COLUMN order_items.product_fsn IS 'FSN code at time of order for activation system';

-- Create index for searching by secret code
CREATE INDEX IF NOT EXISTS idx_order_items_secret_codes ON order_items USING GIN(secret_codes);
```

## Instructions

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste **Migration 1** SQL script
3. Click **Run**
4. Then copy and paste **Migration 2** SQL script  
5. Click **Run**
6. Come back and let me know when done
