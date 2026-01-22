/**
 * Codebase Column Audit Script
 * 
 * This script:
 * 1. Extracts table schemas from Supabase migrations
 * 2. Scans API endpoints for column references
 * 3. Reports mismatches between code and database schema
 * 
 * Run with: node scripts/audit-columns.js
 */

const fs = require('fs');
const path = require('path');

// Tables and their actual columns (from migrations)
const TABLES = {
    // From 012_products_data.sql
    products_data: ['id', 'fsn', 'product_title', 'download_link', 'product_image', 'original_image_url', 'installation_doc', 'slug', 'created_at', 'updated_at'],

    // From ASIN_MAPPING_RUN_THIS.sql (recreated table)
    amazon_asin_mapping: ['id', 'asin', 'fsn', 'product_title', 'created_at'],

    // From 005_amazon_orders.sql + later migrations
    amazon_orders: ['id', 'order_id', 'confirmation_id', 'contact_email', 'contact_phone', 'fsn', 'license_key_id', 'warranty_status', 'installation_id', 'fulfillment_type', 'created_at', 'updated_at', 'quantity', 'order_total', 'currency', 'order_date', 'buyer_email', 'city', 'state', 'postal_code', 'country', 'synced_at', 'is_fraud', 'last_access_ip', 'has_activation_issue', 'issue_status', 'issue_created_at', 'fraud_reason', 'fraud_marked_at', 'is_returned', 'returned_at', 'getcid_used', 'getcid_used_at', 'asin'],

    // From 003_amazon_activation.sql
    amazon_activation_license_keys: ['id', 'license_key', 'fsn', 'product_name', 'download_url', 'order_id', 'is_redeemed', 'redeemed_at', 'created_at', 'updated_at'],

    // From 006_product_requests.sql
    product_requests: ['id', 'order_id', 'customer_email', 'customer_phone', 'request_type', 'status', 'fsn', 'notes', 'created_at', 'updated_at'],

    // From 001_initial_schema.sql
    profiles: ['id', 'email', 'full_name', 'phone', 'role', 'avatar_url', 'created_at', 'updated_at'],
    products: ['id', 'name', 'slug', 'description', 'short_description', 'price', 'original_price', 'category', 'category_slug', 'image_url', 'features', 'is_active', 'stock_quantity', 'sold_count', 'rating', 'review_count', 'meta_title', 'meta_description', 'created_at', 'updated_at'],
    categories: ['id', 'name', 'slug', 'description', 'image_url', 'parent_id', 'is_active', 'display_order', 'created_at', 'updated_at'],
    orders: ['id', 'user_id', 'status', 'total_amount', 'payment_method', 'payment_status', 'shipping_address', 'billing_address', 'notes', 'created_at', 'updated_at'],
    order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price', 'license_key', 'created_at'],
    coupons: ['id', 'code', 'discount_type', 'discount_value', 'min_order_amount', 'max_uses', 'used_count', 'valid_from', 'valid_until', 'is_active', 'created_at', 'updated_at'],
    reviews: ['id', 'user_id', 'product_id', 'rating', 'title', 'content', 'is_verified', 'is_approved', 'created_at', 'updated_at'],
    wishlist: ['id', 'user_id', 'product_id', 'created_at'],
    cart_items: ['id', 'user_id', 'product_id', 'quantity', 'created_at', 'updated_at']
};

// Invalid column names that we've seen cause issues
const KNOWN_INVALID_COLUMNS = {
    'amazon_asin_mapping': ['product_type', 'seller_sku', 'price', 'fulfillment_channel', 'installation_doc'],
    'products_data': ['name', 'description', 'price', 'category', 'is_active']
};

// Scan a file for Supabase queries
function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Find .from('table_name') patterns
    const fromMatches = content.matchAll(/\.from\(['"](\w+)['"]\)/g);

    for (const match of fromMatches) {
        const tableName = match[1];
        const tableColumns = TABLES[tableName];

        if (!tableColumns) continue;

        // Find .select() patterns after this table reference
        const afterFrom = content.slice(match.index);
        const selectMatch = afterFrom.match(/\.select\(['"]([^'"]+)['"]\)/);

        if (selectMatch) {
            const selectColumns = selectMatch[1].split(',').map(c => c.trim().replace(/[*!]$/, '').split('.').pop());

            for (const col of selectColumns) {
                if (col === '*' || col === '') continue;

                // Check if column exists
                if (!tableColumns.includes(col)) {
                    issues.push({
                        file: filePath,
                        table: tableName,
                        column: col,
                        type: 'INVALID_COLUMN',
                        message: `Column '${col}' does not exist in table '${tableName}'`
                    });
                }
            }
        }

        // Check for known invalid columns anywhere in the file context around this table
        if (KNOWN_INVALID_COLUMNS[tableName]) {
            for (const invalidCol of KNOWN_INVALID_COLUMNS[tableName]) {
                if (afterFrom.slice(0, 500).includes(invalidCol)) {
                    issues.push({
                        file: filePath,
                        table: tableName,
                        column: invalidCol,
                        type: 'KNOWN_INVALID',
                        message: `Known invalid column '${invalidCol}' found near table '${tableName}'`
                    });
                }
            }
        }
    }

    return issues;
}

// Recursively scan directory
function scanDirectory(dir) {
    const allIssues = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                allIssues.push(...scanDirectory(fullPath));
            }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
            allIssues.push(...scanFile(fullPath));
        }
    }

    return allIssues;
}

// Main
console.log('🔍 Codebase Column Audit\n');
console.log('Tables being checked:', Object.keys(TABLES).join(', '));
console.log('\n' + '='.repeat(60) + '\n');

const apiDir = path.join(__dirname, '../src/app/api');
const libDir = path.join(__dirname, '../src/lib');
const scriptsDir = path.join(__dirname, '../scripts');

let allIssues = [];

if (fs.existsSync(apiDir)) {
    console.log('Scanning: src/app/api/');
    allIssues.push(...scanDirectory(apiDir));
}

if (fs.existsSync(libDir)) {
    console.log('Scanning: src/lib/');
    allIssues.push(...scanDirectory(libDir));
}

if (fs.existsSync(scriptsDir)) {
    console.log('Scanning: scripts/');
    allIssues.push(...scanDirectory(scriptsDir));
}

console.log('\n' + '='.repeat(60) + '\n');

if (allIssues.length === 0) {
    console.log('✅ No column mismatches found!');
} else {
    console.log(`❌ Found ${allIssues.length} potential issues:\n`);

    // Group by file
    const byFile = {};
    for (const issue of allIssues) {
        if (!byFile[issue.file]) byFile[issue.file] = [];
        byFile[issue.file].push(issue);
    }

    for (const [file, issues] of Object.entries(byFile)) {
        console.log(`\n📁 ${file.replace(process.cwd(), '')}`);
        for (const issue of issues) {
            console.log(`   ⚠️  [${issue.table}] ${issue.message}`);
        }
    }
}

console.log('\n' + '='.repeat(60));
console.log('\n📋 Table Schema Reference:\n');

for (const [table, columns] of Object.entries(TABLES)) {
    console.log(`${table}: ${columns.join(', ')}`);
}
