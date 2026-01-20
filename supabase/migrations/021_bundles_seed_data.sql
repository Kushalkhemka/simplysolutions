-- Migration: Seed bundles table with logical product bundles
-- Creates various bundle combinations for Windows, Office, and productivity software

-- Clear existing bundles (if any) before inserting
TRUNCATE TABLE bundles;

-- =============================================================================
-- WINDOWS + OFFICE COMBO BUNDLES
-- =============================================================================

-- Ultimate Productivity Bundle: Windows 11 Pro + Office 2024 LTSC Pro Plus
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Ultimate Productivity Bundle',
    'ultimate-productivity-bundle',
    'Get the best of both worlds! Windows 11 Pro combined with Office 2024 LTSC Professional Plus for complete productivity. Perfect for professionals and businesses who need the latest Microsoft software at an unbeatable price.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/ultimate-productivity.webp',
    '[
        {"product_type": "windows-11-pro", "quantity": 1, "name": "Windows 11 Pro", "price": 999},
        {"product_type": "office-2024-ltsc-pro-plus", "quantity": 1, "name": "Office 2024 LTSC Professional Plus", "price": 1699}
    ]'::jsonb,
    2698,
    1999,
    26,
    true,
    true,
    1
);

-- Professional Suite: Windows 10/11 Pro + Office 2021 Pro Plus
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Professional Suite Bundle',
    'professional-suite-bundle',
    'The perfect combination for professionals! Windows 10/11 Pro with Office 2021 Professional Plus. Includes Word, Excel, PowerPoint, Outlook, Access, and Publisher. Lifetime licenses with instant delivery.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/professional-suite.webp',
    '[
        {"product_type": "windows-1011-pro", "quantity": 1, "name": "Windows 10/11 Pro", "price": 899},
        {"product_type": "office-2021-pro-plus", "quantity": 1, "name": "Office 2021 Professional Plus", "price": 1499}
    ]'::jsonb,
    2398,
    1799,
    25,
    true,
    true,
    2
);

-- Home Office Starter: Windows 10/11 Home + Office 2019 Pro Plus
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Home Office Starter Bundle',
    'home-office-starter-bundle',
    'Everything you need to set up your home office! Windows 10/11 Home edition paired with Office 2019 Professional Plus. An affordable solution for home users and students.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/home-office-starter.webp',
    '[
        {"product_type": "windows-1011-home", "quantity": 1, "name": "Windows 10/11 Home", "price": 749},
        {"product_type": "office-2019-pro-plus", "quantity": 1, "name": "Office 2019 Professional Plus", "price": 1299}
    ]'::jsonb,
    2048,
    1499,
    27,
    true,
    false,
    3
);

-- =============================================================================
-- CLOUD & SUBSCRIPTION BUNDLES
-- =============================================================================

-- Microsoft 365 Complete: M365 Pro Plus + Windows 11 Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Microsoft 365 Complete Bundle',
    'microsoft-365-complete-bundle',
    'Experience the future of productivity with Microsoft 365 Professional Plus featuring Copilot AI, combined with Windows 11 Pro. Get cloud storage, latest Office apps, and cutting-edge AI capabilities.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/m365-complete.webp',
    '[
        {"product_type": "ms-365-pro-plus", "quantity": 1, "name": "Microsoft 365 Pro Plus with Copilot", "price": 1749},
        {"product_type": "windows-11-pro", "quantity": 1, "name": "Windows 11 Pro", "price": 999}
    ]'::jsonb,
    2748,
    2099,
    24,
    true,
    true,
    4
);

-- Enterprise Cloud Bundle: M365 Enterprise + Windows Enterprise
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Enterprise Cloud Bundle',
    'enterprise-cloud-bundle',
    'The ultimate enterprise solution! Microsoft 365 Enterprise with advanced Copilot AI features combined with Windows 10/11 Enterprise. Ideal for large organizations requiring maximum security and compliance.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/enterprise-cloud.webp',
    '[
        {"product_type": "ms-365-enterprise", "quantity": 1, "name": "Microsoft 365 Enterprise with Copilot", "price": 2499},
        {"product_type": "windows-1011-enterprise", "quantity": 1, "name": "Windows 10/11 Enterprise", "price": 1499}
    ]'::jsonb,
    3998,
    2999,
    25,
    true,
    false,
    5
);

-- =============================================================================
-- CREATIVE & DESIGN BUNDLES
-- =============================================================================

-- Creative Pro Bundle: Canva Pro + Adobe Acrobat Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Creative Pro Bundle',
    'creative-pro-bundle',
    'Unleash your creativity! Canva Pro lifetime subscription for stunning designs combined with Adobe Acrobat Pro 2024 for professional PDF editing. Perfect for content creators, marketers, and designers.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/creative-pro.webp',
    '[
        {"product_type": "canva-pro", "quantity": 1, "name": "Canva Pro Lifetime", "price": 2499},
        {"product_type": "acrobat-pro-2024", "quantity": 1, "name": "Adobe Acrobat Pro 2024", "price": 1499}
    ]'::jsonb,
    3998,
    2999,
    25,
    true,
    true,
    6
);

-- Designer Complete: AutoCAD 1-Year + Visio 2021
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Designer Complete Bundle',
    'designer-complete-bundle',
    'Professional design toolkit! AutoCAD for technical drawings and Visio 2021 Professional for diagrams and flowcharts. Essential bundle for architects, engineers, and technical professionals.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/designer-complete.webp',
    '[
        {"product_type": "autocad-1-year", "quantity": 1, "name": "AutoCAD 1-Year Subscription", "price": 3999},
        {"product_type": "visio-2021", "quantity": 1, "name": "Visio 2021 Professional", "price": 1899}
    ]'::jsonb,
    5898,
    4499,
    24,
    true,
    false,
    7
);

-- =============================================================================
-- PROJECT MANAGEMENT BUNDLES
-- =============================================================================

-- Project Manager Bundle: Project 2021 + Visio 2021
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Project Manager Bundle',
    'project-manager-bundle',
    'Essential tools for project managers! Microsoft Project 2021 Professional for project planning and Visio 2021 Professional for process visualization. Streamline your project workflows.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/project-manager.webp',
    '[
        {"product_type": "project-2021", "quantity": 1, "name": "Project Professional 2021", "price": 1899},
        {"product_type": "visio-2021", "quantity": 1, "name": "Visio 2021 Professional", "price": 1899}
    ]'::jsonb,
    3798,
    2899,
    24,
    true,
    false,
    8
);

-- Complete PM Suite: Project 2021 + Visio 2021 + Office 2021 Pro Plus
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Complete PM Suite',
    'complete-pm-suite',
    'The complete project management solution! Microsoft Project 2021, Visio 2021, and Office 2021 Professional Plus. Everything you need for planning, visualizing, and documenting projects.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/complete-pm-suite.webp',
    '[
        {"product_type": "project-2021", "quantity": 1, "name": "Project Professional 2021", "price": 1899},
        {"product_type": "visio-2021", "quantity": 1, "name": "Visio 2021 Professional", "price": 1899},
        {"product_type": "office-2021-pro-plus", "quantity": 1, "name": "Office 2021 Professional Plus", "price": 1499}
    ]'::jsonb,
    5297,
    3799,
    28,
    true,
    true,
    9
);

-- =============================================================================
-- MAC USER BUNDLES
-- =============================================================================

-- Mac Productivity Bundle: Office 2024 Mac + Canva Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Mac Productivity Bundle',
    'mac-productivity-bundle',
    'Perfect productivity package for Mac users! Office 2024 for macOS with full Word, Excel, and PowerPoint, plus Canva Pro lifetime for stunning visual designs. Maximize your Mac potential.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/mac-productivity.webp',
    '[
        {"product_type": "office-2024-mac", "quantity": 1, "name": "Office 2024 for Mac", "price": 1699},
        {"product_type": "canva-pro", "quantity": 1, "name": "Canva Pro Lifetime", "price": 2499}
    ]'::jsonb,
    4198,
    3199,
    24,
    true,
    false,
    10
);

-- Mac Complete Office: Office 2024 Mac + Acrobat DC Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Mac Complete Office Bundle',
    'mac-complete-office-bundle',
    'Complete office solution for Mac! Office 2024 for macOS combined with Adobe Acrobat DC Pro for advanced PDF capabilities. Handle documents, spreadsheets, and PDFs like a pro.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/mac-complete-office.webp',
    '[
        {"product_type": "office-2024-mac", "quantity": 1, "name": "Office 2024 for Mac", "price": 1699},
        {"product_type": "acrobat-dc-pro", "quantity": 1, "name": "Adobe Acrobat DC Pro", "price": 1799}
    ]'::jsonb,
    3498,
    2649,
    24,
    true,
    false,
    11
);

-- =============================================================================
-- AI & TECH BUNDLES
-- =============================================================================

-- AI Power User Bundle: M365 Pro Plus (with Copilot) + Gemini Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'AI Power User Bundle',
    'ai-power-user-bundle',
    'Harness the power of AI! Microsoft 365 Professional Plus with Copilot AI combined with Google Gemini Pro Advanced 2.5. Get the best of Microsoft and Google AI tools for maximum productivity.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/ai-power-user.webp',
    '[
        {"product_type": "ms-365-pro-plus", "quantity": 1, "name": "Microsoft 365 Pro Plus with Copilot", "price": 1749},
        {"product_type": "gemini-pro-advanced", "quantity": 1, "name": "Gemini Pro Advanced 2.5", "price": 999}
    ]'::jsonb,
    2748,
    1999,
    27,
    true,
    true,
    12
);

-- =============================================================================
-- VALUE BUNDLES
-- =============================================================================

-- Budget Office Bundle: Windows 10 Pro + Office 2016 Pro Plus
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'Budget Office Bundle',
    'budget-office-bundle',
    'Get essential productivity without breaking the bank! Windows 10 Pro combined with Office 2016 Professional Plus. Perfect for users who need reliable software at the best value.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/budget-office.webp',
    '[
        {"product_type": "windows-10-pro", "quantity": 1, "name": "Windows 10 Pro", "price": 799},
        {"product_type": "office-2016-pro-plus", "quantity": 1, "name": "Office 2016 Professional Plus", "price": 999}
    ]'::jsonb,
    1798,
    1299,
    28,
    true,
    false,
    13
);

-- CAD Master Bundle: AutoCAD 3-Year + Windows 11 Pro
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'CAD Master Bundle',
    'cad-master-bundle',
    'The ultimate CAD workstation setup! AutoCAD 3-Year subscription with Windows 11 Pro for optimal performance. Ideal for architects, engineers, and design professionals.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/cad-master.webp',
    '[
        {"product_type": "autocad-3-year", "quantity": 1, "name": "AutoCAD 3-Year Subscription", "price": 5999},
        {"product_type": "windows-11-pro", "quantity": 1, "name": "Windows 11 Pro", "price": 999}
    ]'::jsonb,
    6998,
    5299,
    24,
    true,
    false,
    14
);

-- =============================================================================
-- MEGA BUNDLES (High Value)
-- =============================================================================

-- All-In-One Business Bundle: Windows 11 Pro + Office 2024 + Visio + Project
INSERT INTO bundles (name, slug, description, image_url, products, original_price, bundle_price, discount_percentage, is_active, is_featured, display_order) VALUES
(
    'All-In-One Business Bundle',
    'all-in-one-business-bundle',
    'Everything your business needs in one bundle! Windows 11 Pro, Office 2024 LTSC Professional Plus, Visio 2021, and Project 2021. The most comprehensive productivity package at an incredible price.',
    'https://qcsdnlakugvnwlflhwpo.supabase.co/storage/v1/object/public/product-images/bundles/all-in-one-business.webp',
    '[
        {"product_type": "windows-11-pro", "quantity": 1, "name": "Windows 11 Pro", "price": 999},
        {"product_type": "office-2024-ltsc-pro-plus", "quantity": 1, "name": "Office 2024 LTSC Professional Plus", "price": 1699},
        {"product_type": "visio-2021", "quantity": 1, "name": "Visio 2021 Professional", "price": 1899},
        {"product_type": "project-2021", "quantity": 1, "name": "Project Professional 2021", "price": 1899}
    ]'::jsonb,
    6496,
    4599,
    29,
    true,
    true,
    15
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Bundles seed data inserted successfully!';
    RAISE NOTICE 'Total bundles created: 15';
    RAISE NOTICE 'Categories: Windows+Office, Cloud, Creative, PM, Mac, AI, Value, Mega';
END $$;
