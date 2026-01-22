-- ============================================================
-- Migration: Add missing ASIN mappings and products
-- Adds Gemini Pro and Acrobat Pro products
-- ============================================================

-- Step 1: Add missing ASIN mappings
INSERT INTO amazon_asin_mapping (asin, fsn, product_title) VALUES
    ('B0GFD2WW8R', 'GEMINI', 'Gemini Pro Advanced 2.5 (15-Month Subscription with Veo 3)'),
    ('B0GFD1SXMQ', 'ACROBAT2024', 'Acrobat DC Pro 2024 PDF Reader & Editor (for Win OR MacOS)'),
    ('B0GFD821W3', 'ACROBAT2024', 'Acrobat Pro 2024 Full Version Software for Windows')
ON CONFLICT (asin) DO UPDATE SET 
    fsn = EXCLUDED.fsn,
    product_title = EXCLUDED.product_title;

-- Step 2: Add products_data entries for these FSNs
-- Columns: fsn, product_title, download_link, product_image, installation_doc
INSERT INTO products_data (fsn, product_title, installation_doc) VALUES
    ('GEMINI', 'Gemini Pro Advanced 2.5 (15-Month Subscription with Veo 3 Video Generator)', NULL),
    ('ACROBAT2024', 'Adobe Acrobat Pro 2024 (Pre-Activated for Windows/Mac)', 'acrobat2024')
ON CONFLICT (fsn) DO UPDATE SET
    product_title = EXCLUDED.product_title,
    installation_doc = EXCLUDED.installation_doc;

-- Step 3: Fix ALL existing orders that have SKU instead of FSN
-- This maps ALL seller SKUs to their correct FSN based on the amazon_asin_mapping

-- Create a temporary mapping table with all SKU → FSN relationships
-- (SKUs extracted from listings file, FSN from amazon_asin_mapping via ASIN)
WITH sku_to_fsn AS (
    -- Windows 10/11 Pro
    SELECT 'WINDOWS11' as correct_fsn, '1CCV-BL14-GA6F' as sku UNION ALL
    SELECT 'WINDOWS11', '1CCV-OS32-UBV9' UNION ALL
    
    -- Windows 10 Pro  
    SELECT 'OPSG3TNK9HZDZEM9', '1CCV-BL14-GHLA' UNION ALL
    SELECT 'OPSG3TNK9HZDZEM9', '1CCV-OS32-VYMC' UNION ALL
    
    -- Windows 10/11 Home
    SELECT 'WIN11HOME', '1CCV-BL14-GJY8' UNION ALL
    SELECT 'WIN11HOME', '1CCV-OS32-VAEI' UNION ALL
    
    -- Windows Enterprise
    SELECT 'WIN10ENTERPRISE', '1CCV-BL14-GNMC' UNION ALL
    SELECT 'WIN10ENTERPRISE', '1CCV-OS32-W50L' UNION ALL
    
    -- Windows 11 Pro specific
    SELECT 'WINDOWS11', '1CCV-BL14-GW8J' UNION ALL
    SELECT 'WINDOWS11', '1CCV-BL14-H1L8' UNION ALL
    SELECT 'WINDOWS11', '1CCV-OS32-VIRY' UNION ALL
    SELECT 'WINDOWS11', '1CCV-OS32-VWKC' UNION ALL
    
    -- Office 2021 Pro Plus
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-BL14-F9RO' UNION ALL
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-BL14-GNPA' UNION ALL
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-BL1Z-CWMN' UNION ALL
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-OS32-VXQ0' UNION ALL
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-OS32-W8MF' UNION ALL
    SELECT 'OFFGHYUUFTD9NQNE', '1CCV-OS3T-LNCO' UNION ALL
    
    -- Office 2024 LTSC
    SELECT 'OFFICE2024-WIN', '1CCV-BL1K-05TR' UNION ALL
    SELECT 'OFFICE2024-WIN', '1CCV-BL1Z-CYO9' UNION ALL
    SELECT 'OFFICE2024-WIN', '1CCV-BL2E-46QY' UNION ALL
    SELECT 'OFFICE2024-WIN', '1CCV-OS3G-MKQX' UNION ALL
    SELECT 'OFFICE2024-WIN', '1CCV-OS3T-MV9Y' UNION ALL
    SELECT 'OFFICE2024-WIN', '1CCV-OS47-TNLY' UNION ALL
    
    -- Office 2019 Pro Plus
    SELECT 'OPSG4ZTTK5MMZWPB', '1CCV-BL1J-ZN8C' UNION ALL
    SELECT 'OPSG4ZTTK5MMZWPB', '1CCV-BL1K-0F9D' UNION ALL
    SELECT 'OPSG4ZTTK5MMZWPB', '1CCV-OS3G-JV5E' UNION ALL
    SELECT 'OPSG4ZTTK5MMZWPB', '1CCV-OS3G-LYWC' UNION ALL
    
    -- Office 2016 Pro Plus
    SELECT 'PP2016', '1CCV-BL1Z-CBQM' UNION ALL
    SELECT 'PP2016', '1CCV-OS3T-MUQ4' UNION ALL
    
    -- Microsoft 365 Pro Plus
    SELECT 'OFFICE365', '1CCV-BL1Z-CHBA' UNION ALL
    SELECT 'OFFICE365', '1CCV-BL1Z-D816' UNION ALL
    SELECT 'OFFICE365', '1CCV-BL2E-3Q96' UNION ALL
    SELECT 'OFFICE365', '1CCV-BL2E-41B6' UNION ALL
    SELECT 'OFFICE365', '1CCV-OS3T-M74J' UNION ALL
    SELECT 'OFFICE365', '1CCV-OS3T-MIBZ' UNION ALL
    SELECT 'OFFICE365', '1CCV-OS47-TB99' UNION ALL
    SELECT 'OFFICE365', '1CCV-OS47-UM2C' UNION ALL
    
    -- MS 365 Enterprise
    SELECT '365E5', '1CCV-BL1Z-D26E' UNION ALL
    SELECT '365E5', '1CCV-OS3T-LKHL' UNION ALL
    
    -- Combo (Windows + Office)
    SELECT 'WIN11-PP21', '1CCV-BL14-FNWP' UNION ALL
    SELECT 'WIN11-PP21', '1CCV-BL2E-57S6' UNION ALL
    SELECT 'WIN11-PP21', '1CCV-OS32-W15I' UNION ALL
    SELECT 'WIN11-PP21', '1CCV-OS47-U1JW' UNION ALL
    
    -- Mac Office
    SELECT 'OFFICE2024-MAC', '1CCV-BL1J-ZYED' UNION ALL
    SELECT 'OFFICE2024-MAC', '1CCV-BL1K-0KGT' UNION ALL
    SELECT 'OFFICE2024-MAC', '1CCV-BL2E-42BP' UNION ALL
    SELECT 'OFFICE2024-MAC', '1CCV-OS3G-JPYK' UNION ALL
    SELECT 'OFFICE2024-MAC', '1CCV-OS3G-N5BA' UNION ALL
    SELECT 'OFFICE2024-MAC', '1CCV-OS47-U50P' UNION ALL
    
    -- Canva
    SELECT 'CANVA', '1CCV-BL14-H4RD' UNION ALL
    SELECT 'CANVA', '1CCV-BL1J-YZ59' UNION ALL
    SELECT 'CANVA', '1CCV-OS32-VBC3' UNION ALL
    SELECT 'CANVA', '1CCV-OS3G-M73M' UNION ALL
    
    -- AutoCAD 1-Year
    SELECT 'AUTOCAD-1YEAR', '1CCV-BL1J-YSKJ' UNION ALL
    SELECT 'AUTOCAD-1YEAR', '1CCV-OS3G-MRQE' UNION ALL
    
    -- AutoCAD 3-Year
    SELECT 'AUTOCAD-3YEAR', '1CCV-BL1J-YMVN' UNION ALL
    SELECT 'AUTOCAD-3YEAR', '1CCV-BL1J-Z11D' UNION ALL
    SELECT 'AUTOCAD-3YEAR', '1CCV-OS3G-N6TN' UNION ALL
    SELECT 'AUTOCAD-3YEAR', '1CCV-OS3G-N7YA' UNION ALL
    
    -- Visio
    SELECT 'VISIO2021', '1CCV-BL1Z-C6RQ' UNION ALL
    SELECT 'VISIO2021', '1CCV-OS3T-M58L' UNION ALL
    
    -- Project
    SELECT 'PROJECT2021', '1CCV-BL1Z-DKPH' UNION ALL
    SELECT 'PROJECT2021', '1CCV-OS3T-M1B7' UNION ALL
    
    -- Gemini
    SELECT 'GEMINI', '1CCV-BL1K-0H4G' UNION ALL
    SELECT 'GEMINI', '1CCV-OS3G-NR2I' UNION ALL
    
    -- Acrobat
    SELECT 'ACROBAT2024', '1CCV-BL1Z-D0X1' UNION ALL
    SELECT 'ACROBAT2024', '1CCV-BL1Z-DF6N' UNION ALL
    SELECT 'ACROBAT2024', '1CCV-OS3T-L2YO' UNION ALL
    SELECT 'ACROBAT2024', '1CCV-OS3T-M6HY'
)
UPDATE amazon_orders ao
SET fsn = s.correct_fsn
FROM sku_to_fsn s
WHERE ao.fsn = s.sku;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check new ASIN mappings were added
SELECT 'New ASIN mappings added: ' || COUNT(*) as result 
FROM amazon_asin_mapping 
WHERE asin IN ('B0GFD2WW8R', 'B0GFD1SXMQ', 'B0GFD821W3');

-- Check new products were created
SELECT 'New products added: ' || COUNT(*) as result 
FROM products_data 
WHERE fsn IN ('GEMINI', 'ACROBAT2024');

-- Show orders by FSN (to verify the fix worked)
SELECT fsn, COUNT(*) as order_count
FROM amazon_orders
WHERE fsn IS NOT NULL
GROUP BY fsn
ORDER BY order_count DESC;

-- Check if any orders still have SKU patterns (1CCV-XXXX-XXXX) in FSN field
SELECT 'Orders with SKU in FSN (should be 0): ' || COUNT(*) as result
FROM amazon_orders
WHERE fsn LIKE '1CCV-%';

-- Show any remaining orders with SKU pattern that weren't mapped
SELECT fsn, COUNT(*) as count
FROM amazon_orders
WHERE fsn LIKE '1CCV-%'
GROUP BY fsn
ORDER BY count DESC;
