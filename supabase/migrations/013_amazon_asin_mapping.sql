-- Migration: Create amazon_asin_mapping table
-- Maps Amazon ASINs to product types for order sync
-- Multiple ASINs can map to the same product_type (MFN vs FBA listings)

CREATE TABLE IF NOT EXISTS amazon_asin_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin VARCHAR(20) UNIQUE NOT NULL,
    seller_sku VARCHAR(50) NOT NULL,
    product_type VARCHAR(100) NOT NULL,  -- Normalized product type for license key lookup
    product_title TEXT,
    price DECIMAL(10,2),
    fulfillment_channel VARCHAR(20),  -- DEFAULT (MFN) or AMAZON_IN (FBA)
    installation_doc VARCHAR(100),  -- Reference to installation doc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_asin_mapping_asin ON amazon_asin_mapping(asin);
CREATE INDEX idx_asin_mapping_product_type ON amazon_asin_mapping(product_type);
CREATE INDEX idx_asin_mapping_sku ON amazon_asin_mapping(seller_sku);

-- Enable RLS
ALTER TABLE amazon_asin_mapping ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for activation flow)
CREATE POLICY "Allow public read on amazon_asin_mapping" 
ON amazon_asin_mapping FOR SELECT USING (true);

-- Only service role can modify
CREATE POLICY "Service role full access on amazon_asin_mapping" 
ON amazon_asin_mapping FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE amazon_asin_mapping IS 'Maps Amazon ASINs to product types for order sync and activation';
COMMENT ON COLUMN amazon_asin_mapping.asin IS 'Amazon Standard Identification Number - unique product ID';
COMMENT ON COLUMN amazon_asin_mapping.product_type IS 'Normalized product type used for license key matching';
COMMENT ON COLUMN amazon_asin_mapping.installation_doc IS 'Slug for installation documentation';

-- Insert all ASIN mappings from All Listings Report
-- Windows Products
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
-- Windows 10/11 Pro (multiple ASINs for same product)
('B0GFD39GSF', '1CCV-BL14-GA6F', 'windows-1011-pro', 'Windows 10/11 Pro Product License Key', 'win11-win10pro_upgrade', 1499, 'DEFAULT'),
('B0GFD39GSF', '1CCV-OS32-UBV9', 'windows-1011-pro', 'Windows 10/11 Pro Product License Key', 'win11-win10pro_upgrade', 899, 'AMAZON_IN')
ON CONFLICT (asin) DO UPDATE SET 
    seller_sku = EXCLUDED.seller_sku,
    product_type = EXCLUDED.product_type,
    updated_at = NOW();

-- Windows 10 Pro
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCQVPFP', '1CCV-BL14-GHLA', 'windows-10-pro', 'Windows 10 Pro Product License Key', 'win11-win10pro_upgrade', 799, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Windows 10/11 Home
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD43YQ6', '1CCV-BL14-GJY8', 'windows-1011-home', 'Windows 10/11 Home Product License Key', 'win11-win10pro_upgrade', 749, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Windows 10/11 Enterprise
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCYLGZ2', '1CCV-BL14-GNMC', 'windows-1011-enterprise', 'Windows 10/11 Enterprise Product License Key', 'win11-win10pro_upgrade', 1499, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Windows 11 Pro (specific)
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCY86RC', '1CCV-BL14-GW8J', 'windows-11-pro', 'Windows 11 Pro Product License Key', 'win11-win10pro_upgrade', 999, 'DEFAULT'),
('B0GFD4628T', '1CCV-BL14-H1L8', 'windows-11-pro', 'Windows 11 Pro Lifetime Activation Retail License', 'win11-win10pro_upgrade', 899, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Office Professional Plus 2021
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCYYX99', '1CCV-BL14-F9RO', 'office-2021-pro-plus', 'Office Professional Plus 2021', 'office2021', 1499, 'DEFAULT'),
('B0GFCXTRX8', '1CCV-BL14-GNPA', 'office-2021-pro-plus', 'MS Professional Plus 2021 Lifetime', 'office2021', 1499, 'DEFAULT'),
('B0GFCVX9N5', '1CCV-BL1Z-CWMN', 'office-2021-pro-plus', 'Office Professional Plus 2021 for Windows', 'office2021', 1499, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Office 2024 LTSC Professional Plus
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCW7Z2Q', '1CCV-BL1K-05TR', 'office-2024-ltsc-pro-plus', 'MS Office LTSC Professional Plus 2024', 'office2024win', 1699, 'DEFAULT'),
('B0GFD279VQ', '1CCV-BL2E-46QY', 'office-2024-ltsc-pro-plus', 'Office MS 2024 LTSC Professional Plus', 'office2024win', 1599, 'AMAZON_IN'),
('B0GFCQ2KHC', '1CCV-BL1Z-CYO9', 'office-2024-ltsc-pro-plus', 'Office Pro Plus LTSC 2024 Full Edition', 'office2024win', 1699, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Office 2019 Professional Plus
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCWLDM7', '1CCV-BL1K-0F9D', 'office-2019-pro-plus', 'Office 2019 Professional Plus', 'office2019', 1299, 'DEFAULT'),
('B0GFCRK3JH', '1CCV-BL1J-ZN8C', 'office-2019-pro-plus', 'Office 2019 Professional Plus Retail', 'office2019', 1299, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Office 2016 Professional Plus
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD71MNQ', '1CCV-BL1Z-CBQM', 'office-2016-pro-plus', 'Office 2016 Professional Plus', 'office2019', 999, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Microsoft 365 Professional Plus
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD767NM', '1CCV-BL2E-41B6', 'ms-365-pro-plus', 'Office MS 365 Professional Plus Edition', 'office365', 1799, 'DEFAULT'),
('B0GFCVV92K', '1CCV-BL1Z-D816', 'ms-365-pro-plus', 'MS 365 Pro Plus with Copilot AI', 'office365', 1749, 'DEFAULT'),
('B0GFCWMC8G', '1CCV-BL2E-3Q96', 'ms-365-pro-plus', 'MS Office Copilot 365 Pro Plus', 'office365', 1699, 'DEFAULT'),
('B0GFDB19CZ', '1CCV-BL1Z-CHBA', 'ms-365-pro-plus', 'MS Professional Plus 365 Copilot', 'office365', 1799, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Microsoft 365 Enterprise
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD2TPQD', '1CCV-BL1Z-D26E', 'ms-365-enterprise', 'MS 365 Enterprise Edition with Copilot AI', 'office365ent', 2499, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Office + Windows Combo Packs
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD72V9P', '1CCV-BL14-FNWP', 'office-windows-combo', 'Office 2021 & Windows 11 Professional Combo', 'win11-pp2021_combo', 2099, 'DEFAULT'),
('B0GFD36XZN', '1CCV-BL2E-57S6', 'office-windows-combo', 'Office 2024 & Windows 10/11 Professional Combo', 'win11-pp2021_combo', 2299, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Mac Office Products
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFDBZLPK', '1CCV-BL1J-ZYED', 'office-2024-mac', 'MS Home 2024 for macOS', 'office2024mac', 1699, 'DEFAULT'),
('B0GFCXT8RG', '1CCV-BL1K-0KGT', 'office-2024-mac', 'MS Home Suite 2024 for macOS', 'office2024mac', 1799, 'DEFAULT'),
('B0GFCWP2RS', '1CCV-BL2E-42BP', 'office-2024-mac', 'MS 2024 LTSC Standard for macOS', 'office2024mac', 1899, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Canva Pro
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCNRFMF', '1CCV-BL14-H4RD', 'canva-pro', 'Canva Pro Lifetime Subscription', NULL, 2499, 'DEFAULT'),
('B0GFD33T8C', '1CCV-BL1J-YZ59', 'canva-pro', 'Canva Pro Lifetime Subscription', NULL, 2499, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- AutoCAD
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCW3XDK', '1CCV-BL1J-YSKJ', 'autocad-1-year', 'AutoCAD Software 1-Year Subscription', NULL, 3999, 'DEFAULT'),
('B0GFD7FY8D', '1CCV-BL1J-Z11D', 'autocad-3-year', 'AutoCAD Software 3-Year Subscription', NULL, 5999, 'DEFAULT'),
('B0GFD217X6', '1CCV-BL1J-YMVN', 'autocad-3-year', 'AutoCAD 2026 Edition 3-Years Subscription', NULL, 5999, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Adobe Acrobat
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD821W3', '1CCV-BL1Z-DF6N', 'acrobat-pro-2024', 'Acrobat Pro 2024 Full Version', NULL, 1499, 'DEFAULT'),
('B0GFD1SXMQ', '1CCV-BL1Z-D0X1', 'acrobat-dc-pro', 'Acrobat DC Pro 2024 PDF Reader & Editor', NULL, 1799, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Visio & Project
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFCY2D33', '1CCV-BL1Z-C6RQ', 'visio-2021', 'Visio 2021 Professional', 'visio2021', 1899, 'DEFAULT'),
('B0GFD2PRY1', '1CCV-BL1Z-DKPH', 'project-2021', 'Project Professional 2021', 'project2021', 1899, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();

-- Gemini Pro
INSERT INTO amazon_asin_mapping (asin, seller_sku, product_type, product_title, installation_doc, price, fulfillment_channel) VALUES
('B0GFD2WW8R', '1CCV-BL1K-0H4G', 'gemini-pro-advanced', 'Gemini Pro Advanced 2.5', NULL, 999, 'DEFAULT')
ON CONFLICT (asin) DO UPDATE SET product_type = EXCLUDED.product_type, updated_at = NOW();
