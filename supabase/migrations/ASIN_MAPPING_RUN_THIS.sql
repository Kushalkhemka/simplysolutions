-- ============================================================
-- FIXED: ASIN → FSN Mapping (Using ACTUAL FSN from products_data)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop and recreate the ASIN mapping table
DROP TABLE IF EXISTS amazon_asin_mapping CASCADE;

-- Create ASIN → FSN mapping table
CREATE TABLE amazon_asin_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin VARCHAR(20) UNIQUE NOT NULL,
    fsn VARCHAR(100) NOT NULL,  -- Must match products_data.fsn
    product_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asin_mapping_asin ON amazon_asin_mapping(asin);
CREATE INDEX idx_asin_mapping_fsn ON amazon_asin_mapping(fsn);

ALTER TABLE amazon_asin_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on amazon_asin_mapping" 
ON amazon_asin_mapping FOR SELECT USING (true);

CREATE POLICY "Service role full access on amazon_asin_mapping" 
ON amazon_asin_mapping FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- ASIN → FSN Mappings (FSN values from products_data table)
-- ============================================================
INSERT INTO amazon_asin_mapping (asin, fsn, product_title) VALUES

-- Windows 11/10 Pro → WINDOWS11
('B0GFD39GSF', 'WINDOWS11', 'Windows 10/11 Pro'),
('B0GFCY86RC', 'WINDOWS11', 'Windows 11 Pro'),
('B0GFD4628T', 'WINDOWS11', 'Windows 11 Pro Retail'),

-- Windows 10 Pro → OPSG3TNK9HZDZEM9
('B0GFCQVPFP', 'OPSG3TNK9HZDZEM9', 'Windows 10 Pro'),

-- Windows 10/11 Home → OPSGZ8QG4JZ3AHMV  
('B0GFD43YQ6', 'WIN11HOME', 'Windows 10/11 Home'),

-- Windows Enterprise → WIN10ENTERPRISE / WIN11ENTERPRISE
('B0GFCYLGZ2', 'WIN10ENTERPRISE', 'Windows 10/11 Enterprise'),

-- Office 2021 Pro Plus → OFFGHYUUFTD9NQNE / OFFG9MREFCXD658G
('B0GFCYYX99', 'OFFGHYUUFTD9NQNE', 'Office 2021 Professional Plus'),
('B0GFCXTRX8', 'OFFGHYUUFTD9NQNE', 'MS Professional Plus 2021'),
('B0GFCVX9N5', 'OFFGHYUUFTD9NQNE', 'Office 2021 Professional Plus'),

-- Office 2024 LTSC → OFFICE2024-WIN
('B0GFCW7Z2Q', 'OFFICE2024-WIN', 'Office 2024 LTSC Professional Plus'),
('B0GFD279VQ', 'OFFICE2024-WIN', 'Office 2024 LTSC Professional Plus'),
('B0GFCQ2KHC', 'OFFICE2024-WIN', 'Office 2024 LTSC Professional Plus'),

-- Office 2019 Pro Plus → OPSG4ZTTK5MMZWPB
('B0GFCWLDM7', 'OPSG4ZTTK5MMZWPB', 'Office 2019 Professional Plus'),
('B0GFCRK3JH', 'OPSG4ZTTK5MMZWPB', 'Office 2019 Professional Plus'),

-- Office 2016 Pro Plus → PP2016
('B0GFD71MNQ', 'PP2016', 'Office 2016 Professional Plus'),

-- Microsoft 365 → OFFICE365
('B0GFD767NM', 'OFFICE365', 'Microsoft 365 Professional Plus'),
('B0GFCVV92K', 'OFFICE365', 'MS 365 Pro Plus with Copilot'),
('B0GFCWMC8G', 'OFFICE365', 'MS 365 Copilot Pro Plus'),
('B0GFDB19CZ', 'OFFICE365', 'MS 365 Professional Plus Copilot'),

-- MS 365 Enterprise → 365E5
('B0GFD2TPQD', '365E5', 'MS 365 Enterprise with Copilot'),

-- Combo: Windows + Office → WIN11-PP21
('B0GFD72V9P', 'WIN11-PP21', 'Office 2021 + Windows 11 Combo'),
('B0GFD36XZN', 'WIN11-PP21', 'Office 2024 + Windows Combo'),

-- Mac Office → OFFICE2024-MAC
('B0GFDBZLPK', 'OFFICE2024-MAC', 'MS Home 2024 for macOS'),
('B0GFCXT8RG', 'OFFICE2024-MAC', 'MS Home Suite 2024 for macOS'),
('B0GFCWP2RS', 'OFFICE2024-MAC', 'MS 2024 LTSC for macOS'),

-- Canva → CANVA
('B0GFCNRFMF', 'CANVA', 'Canva Pro Lifetime'),
('B0GFD33T8C', 'CANVA', 'Canva Pro Lifetime'),

-- AutoCAD → AUTOCAD-1YEAR / AUTOCAD-3YEAR
('B0GFCW3XDK', 'AUTOCAD-1YEAR', 'AutoCAD 1-Year'),
('B0GFD7FY8D', 'AUTOCAD-3YEAR', 'AutoCAD 3-Year'),
('B0GFD217X6', 'AUTOCAD-3YEAR', 'AutoCAD 2026 3-Year'),

-- Visio → VISIO2021
('B0GFCY2D33', 'VISIO2021', 'Visio 2021 Professional'),

-- Project → PROJECT2021
('B0GFD2PRY1', 'PROJECT2021', 'Project Professional 2021')

-- Note: Acrobat and Gemini don't have FSN in products_data yet
-- Add them if needed

ON CONFLICT (asin) DO UPDATE SET 
    fsn = EXCLUDED.fsn,
    product_title = EXCLUDED.product_title;

-- ============================================================
-- Verify
-- ============================================================
SELECT 'ASIN Mappings: ' || COUNT(*) as result FROM amazon_asin_mapping;
SELECT 'Unique FSNs: ' || COUNT(DISTINCT fsn) as result FROM amazon_asin_mapping;

-- Show the mapping
SELECT asin, fsn, product_title FROM amazon_asin_mapping ORDER BY fsn;
