// Database seeding script
// Run with: npx tsx scripts/seed.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import slugify from 'slugify';

// Load .env.local
config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Category definitions
const categories = [
    {
        name: 'Operating Systems',
        slug: 'operating-systems',
        description: 'Windows 10, Windows 11 Pro, Home, Enterprise editions',
        icon: 'Monitor',
        display_order: 1,
        is_featured: true,
    },
    {
        name: 'Office Suites',
        slug: 'office-suites',
        description: 'Microsoft Office 2016, 2019, 2021, 2024, 365 editions',
        icon: 'FileText',
        display_order: 2,
        is_featured: true,
    },
    {
        name: 'macOS Software',
        slug: 'macos-software',
        description: 'Microsoft Office for Mac, productivity tools for macOS',
        icon: 'Apple',
        display_order: 3,
        is_featured: true,
    },
    {
        name: 'Design Software',
        slug: 'design-software',
        description: 'AutoCAD, Canva Pro, and other design tools',
        icon: 'Palette',
        display_order: 4,
        is_featured: true,
    },
    {
        name: 'PDF Tools',
        slug: 'pdf-tools',
        description: 'Adobe Acrobat Pro and PDF editing software',
        icon: 'FileType',
        display_order: 5,
        is_featured: false,
    },
    {
        name: 'AI Tools',
        slug: 'ai-tools',
        description: 'AI-powered tools like Gemini Pro Advanced',
        icon: 'Brain',
        display_order: 6,
        is_featured: true,
    },
    {
        name: 'Productivity',
        slug: 'productivity',
        description: 'Visio, Project Professional, and productivity tools',
        icon: 'BarChart',
        display_order: 7,
        is_featured: false,
    },
];

// Map category names to slugs for product assignment
const categorySlugMap: Record<string, string> = {
    'Operating Systems': 'operating-systems',
    'Office Suites': 'office-suites',
    'macOS Software': 'macos-software',
    'Design Software': 'design-software',
    'PDF Tools': 'pdf-tools',
    'AI Tools': 'ai-tools',
    'Productivity': 'productivity',
    'Other': 'office-suites', // Default fallback
};

async function seedCategories() {
    console.log('📁 Seeding categories...');

    const { data, error } = await supabase
        .from('categories')
        .upsert(categories, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }

    console.log(`✅ Seeded ${data.length} categories`);
    return data;
}

async function seedProducts(categoryData: any[]) {
    console.log('📦 Seeding products...');

    // Read products from extracted JSON
    const productsPath = path.join(__dirname, '..', '..', 'products_extracted.json');

    if (!fs.existsSync(productsPath)) {
        console.error('❌ products_extracted.json not found at:', productsPath);
        console.log('   Please run the product extraction script first.');
        process.exit(1);
    }

    const rawProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    // Create category id lookup
    const categoryIdMap: Record<string, string> = {};
    categoryData.forEach(cat => {
        categoryIdMap[cat.slug] = cat.id;
    });

    // Transform products for database
    const products = rawProducts.map((p: any) => {
        const categorySlug = categorySlugMap[p.category] || 'office-suites';
        const categoryId = categoryIdMap[categorySlug];

        return {
            sku: p.sku,
            name: p.item_name,
            slug: slugify(p.item_name, { lower: true, strict: true }).slice(0, 100) + '-' + p.sku.toLowerCase(),
            description: p.description || null,
            short_description: p.item_name,
            brand: p.brand_name || 'Microsoft',
            manufacturer: p.manufacturer || 'Microsoft Corporation India',
            model_name: p.model_name || null,
            category_id: categoryId,
            price: p.your_price,
            mrp: p.mrp,
            main_image_url: p.main_image_url,
            image_urls: p.image_urls || [],
            bullet_points: p.bullet_points || [],
            keywords: p.keywords || [],
            operating_systems: p.operating_systems || [],
            edition: p.edition || null,
            subscription_term: p.subscription_term || 'Lifetime Validity',
            number_of_licenses: p.number_of_licenses || 1,
            max_devices: p.supported_devices_quantity || 1,
            is_active: true,
            is_featured: false,
            is_bestseller: ['OFF_1', 'OFF_3', 'OFF_5', 'OFF_8'].includes(p.sku), // Mark some as bestsellers
            is_new_arrival: ['OFF_21', 'OFF_22', 'OFF_26', 'OFF_30'].includes(p.sku), // Mark some as new
            stock_quantity: 100, // Initial stock
        };
    });

    // Insert products in batches
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'sku' })
            .select();

        if (error) {
            console.error(`❌ Error seeding products batch ${i / batchSize + 1}:`, error);
            throw error;
        }

        insertedCount += data.length;
    }

    console.log(`✅ Seeded ${insertedCount} products`);

    // Update category product counts
    for (const cat of categoryData) {
        const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_active', true);

        await supabase
            .from('categories')
            .update({ product_count: count || 0 })
            .eq('id', cat.id);
    }

    console.log('✅ Updated category product counts');
}

async function seedSampleCoupons() {
    console.log('🎟️ Seeding sample coupons...');

    const coupons = [
        {
            code: 'WELCOME10',
            description: 'Welcome discount - 10% off on first order',
            discount_type: 'percentage' as const,
            discount_value: 10,
            max_discount_amount: 500,
            min_order_amount: 500,
            usage_limit: 1000,
            per_user_limit: 1,
            is_active: true,
        },
        {
            code: 'FLAT200',
            description: 'Flat ₹200 off on orders above ₹1500',
            discount_type: 'fixed' as const,
            discount_value: 200,
            min_order_amount: 1500,
            usage_limit: 500,
            per_user_limit: 2,
            is_active: true,
        },
        {
            code: 'SAVE15',
            description: '15% off on orders above ₹2000',
            discount_type: 'percentage' as const,
            discount_value: 15,
            max_discount_amount: 1000,
            min_order_amount: 2000,
            usage_limit: 200,
            per_user_limit: 1,
            is_active: true,
        },
    ];

    const { data, error } = await supabase
        .from('coupons')
        .upsert(coupons, { onConflict: 'code' })
        .select();

    if (error) {
        console.error('❌ Error seeding coupons:', error);
        throw error;
    }

    console.log(`✅ Seeded ${data.length} coupons`);
}

async function main() {
    console.log('🚀 Starting database seed...\n');

    try {
        // Seed categories first
        const categoryData = await seedCategories();

        // Seed products
        await seedProducts(categoryData);

        // Seed sample coupons
        await seedSampleCoupons();

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Add your Supabase credentials to .env.local');
        console.log('2. Run the schema migration in Supabase');
        console.log('3. Start the dev server: npm run dev');
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
