-- Update bundle images with Supabase storage URLs
-- Images uploaded to product-assets/bundles/

UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/ultimate-productivity-bundle-win11-pro.jpg' WHERE slug = 'ultimate-productivity-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/professional-suite-bundle-win10-11-pro.jpg' WHERE slug = 'professional-suite-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/home-office-starter-bundle-win10-11-home.jpg' WHERE slug = 'home-office-starter-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/microsoft-365-complete-m365-pro.jpg' WHERE slug = 'microsoft-365-complete';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/enterprise-cloud-bundle-m365-enterprise.jpg' WHERE slug = 'enterprise-cloud-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/creative-pro-bundle-canva-pro.jpg' WHERE slug = 'creative-pro-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/designer-complete-bundle-office-2024.jpg' WHERE slug = 'designer-complete-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/project-manager-bundle-office-2021.jpg' WHERE slug = 'project-manager-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/complete-pm-suite-office-2021.jpg' WHERE slug = 'complete-pm-suite';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/mac-productivity-bundle-office-mac-2024.jpg' WHERE slug = 'mac-productivity-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/mac-complete-office-office-mac-2024.jpg' WHERE slug = 'mac-complete-office';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/ai-power-user-bundle-m365-copilot.jpg' WHERE slug = 'ai-power-user-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/budget-office-bundle-win10-pro.jpg' WHERE slug = 'budget-office-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/cad-master-bundle-win11-pro.jpg' WHERE slug = 'cad-master-bundle';
UPDATE bundles SET image_url = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles/all-in-one-business-bundle-combo.jpg' WHERE slug = 'all-in-one-business-bundle';

-- Verify updates
SELECT slug, image_url FROM bundles ORDER BY display_order;
