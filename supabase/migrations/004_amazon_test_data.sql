-- Test data for Amazon Activation System
-- Run this in Supabase SQL Editor AFTER creating the tables

-- Add test license keys
INSERT INTO amazon_activation_license_keys (license_key, sku, product_name, product_image, download_url)
VALUES 
  ('GFNDK-XTCYR-GJF2R-PXM2H-M4KJK', 'OFFICE2021-WIN', 'Microsoft Office Professional Plus 2021 (1 User, Lifetime Validity)', '/images/msoffice2021-pro.png', 'https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2021Retail.img'),
  ('XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 'OFFICE2021-WIN', 'Microsoft Office Professional Plus 2021 (1 User, Lifetime Validity)', '/images/msoffice2021-pro.png', 'https://officecdn.microsoft.com/db/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/media/en-us/ProPlus2021Retail.img'),
  ('YYYYY-YYYYY-YYYYY-YYYYY-YYYYY', 'OFFICE365-WIN', 'Microsoft Office 365 Pro Plus (1 User, 1 Year)', '/images/msoffice365-pro.png', 'https://officecdn.microsoft.com/pr/492350f6-3a01-4f97-b9c0-c7c6ddf67d60/Office/Data/o365ProPlus.cab');

-- Add test secret codes
INSERT INTO amazon_secret_codes (secret_code, sku)
VALUES 
  ('123456789012345', 'OFFICE2021-WIN'),
  ('987654321098765', 'OFFICE2021-WIN'),
  ('111222333444555', 'OFFICE365-WIN');

-- Verify data was inserted
SELECT 'Secret Codes:' as info;
SELECT * FROM amazon_secret_codes;

SELECT 'License Keys:' as info;
SELECT * FROM amazon_activation_license_keys;
