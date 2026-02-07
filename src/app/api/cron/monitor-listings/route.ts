/**
 * Cron endpoint to monitor Amazon product listings for flagged keywords
 * Schedule: Every 1 hour (configurable in Vercel/deployment)
 * 
 * Purpose:
 * - Detects competitor sabotage attempts (adding "email", "digital" keywords)
 * - Scans titles, descriptions, and bullet points
 * - Sends email and push notifications when NEW flagged keywords are detected
 * - Ignores baseline ASINs that are known to have safe keyword usage
 * 
 * Flagged Keywords (can trigger abuse reports):
 * - email, e-mail
 * - digital, digital download
 * - code delivery, instant delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { amazonAsinMap } from '@/lib/data/amazonAsinMap';
import { logCronStart, logCronSuccess, logCronError } from '@/lib/cron/logger';
import { sendPushToAdmins } from '@/lib/push/admin-notifications';
import { getActiveSellerAccounts, SellerAccountWithCredentials } from '@/lib/amazon/seller-accounts';

const SP_API_ENDPOINT = 'https://sellingpartnerapi-eu.amazon.com';

// Flagged keywords that may trigger abuse reports
const FLAGGED_KEYWORDS = [
    'email',
    'e-mail',
    'digital download',
    'digital delivery',
    'code delivery',
    'instant delivery',
    'download link',
    'electronic delivery'
];

// Keywords that are safe in context (false positives)
const SAFE_CONTEXTS = [
    'email notification',
    'email support',
    'email assistance',
    'contact email',
    'buyer email',
    'support email'
];

// Baseline ASINs - these have known "email" keywords that are harmless (added by us)
// Only alert on NEW products with flagged keywords
const BASELINE_ASINS = [
    'B0GFCQ2KHC', // office-pro-plus-ltsc-2024 - mentions "emails" in description
    'B0GFD72V9P', // office-2021-windows-11-combo - mentions "email" 
    'B0GFD2WW8R'  // gemini-pro-advanced - mentions "email" for account
];

interface FlaggedResult {
    asin: string;
    productKey: string;
    title: string;
    flaggedKeywords: string[];
    locations: string[]; // 'title', 'description', 'bullet_points'
    url: string;
    isNew: boolean; // true if not in baseline
}

// Verify cron secret
function verifyCronAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true;
    return authHeader === `Bearer ${cronSecret}`;
}

async function getAccessToken(account: SellerAccountWithCredentials): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: account.clientId,
            client_secret: account.clientSecret
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchCatalogItem(accessToken: string, asin: string, marketplaceId: string): Promise<any> {
    const url = new URL(`${SP_API_ENDPOINT}/catalog/2022-04-01/items/${asin}`);
    url.searchParams.set('marketplaceIds', marketplaceId);
    url.searchParams.set('includedData', 'attributes,summaries');

    const response = await fetch(url.toString(), {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        return { error: `${response.status}` };
    }

    return await response.json();
}

function checkForFlaggedKeywords(text: string): string[] {
    if (!text) return [];

    const lowerText = text.toLowerCase();
    const foundKeywords: string[] = [];

    // Check if text contains safe contexts first
    const hasSafeContext = SAFE_CONTEXTS.some(safe => lowerText.includes(safe));

    for (const keyword of FLAGGED_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            // Skip if it's in a safe context
            if (keyword === 'email' && hasSafeContext) continue;
            foundKeywords.push(keyword);
        }
    }

    return foundKeywords;
}

function scanProduct(asin: string, productKey: string, catalogData: any): FlaggedResult | null {
    if (catalogData.error) return null;

    const summary = catalogData.summaries?.[0] || {};
    const attributes = catalogData.attributes || {};

    const title = summary.itemName || attributes.item_name?.[0]?.value || '';
    const description = attributes.product_description?.[0]?.value || '';
    const bulletPoints = (attributes.bullet_point || []).map((bp: any) => bp.value).join(' ');

    const allFlagged: string[] = [];
    const locations: string[] = [];

    // Check title
    const titleFlags = checkForFlaggedKeywords(title);
    if (titleFlags.length > 0) {
        allFlagged.push(...titleFlags);
        locations.push('title');
    }

    // Check description
    const descFlags = checkForFlaggedKeywords(description);
    if (descFlags.length > 0) {
        allFlagged.push(...descFlags);
        if (!locations.includes('description')) locations.push('description');
    }

    // Check bullet points
    const bulletFlags = checkForFlaggedKeywords(bulletPoints);
    if (bulletFlags.length > 0) {
        allFlagged.push(...bulletFlags);
        if (!locations.includes('bullet_points')) locations.push('bullet_points');
    }

    if (allFlagged.length > 0) {
        return {
            asin,
            productKey,
            title: title.substring(0, 100) + (title.length > 100 ? '...' : ''),
            flaggedKeywords: [...new Set(allFlagged)], // Deduplicate
            locations,
            url: `https://www.amazon.in/dp/${asin}`,
            isNew: !BASELINE_ASINS.includes(asin) // New if not in baseline
        };
    }

    return null;
}

async function sendListingAlertEmail(flaggedProducts: FlaggedResult[]): Promise<boolean> {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@simplysolutions.co.in';

    const productRows = flaggedProducts.map(p => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 8px;">
                <a href="${p.url}" style="color: #007185; text-decoration: none; font-weight: bold;">${p.asin}</a>
                <br><span style="color: #666; font-size: 12px;">${p.productKey}</span>
            </td>
            <td style="padding: 12px 8px; max-width: 250px;">${p.title}</td>
            <td style="padding: 12px 8px;">
                ${p.flaggedKeywords.map(k => `<span style="background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin: 2px;">${k}</span>`).join(' ')}
            </td>
            <td style="padding: 12px 8px;">${p.locations.join(', ')}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">⚠️ Listing Alert</h1>
                <p style="margin: 10px 0 0;">Flagged Keywords Detected in Amazon Listings</p>
            </div>
            
            <div style="padding: 20px; background: #fff; border: 1px solid #ddd; border-top: none;">
                <p><strong>Alert Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                <p><strong>Products Affected:</strong> ${flaggedProducts.length}</p>
                
                <p style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">
                    ⚠️ These keywords may trigger Amazon's digital download abuse detection. 
                    Review immediately and file a safe-T claim if competitor sabotage is suspected.
                </p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px 8px; text-align: left;">ASIN</th>
                            <th style="padding: 10px 8px; text-align: left;">Title</th>
                            <th style="padding: 10px 8px; text-align: left;">Flagged Keywords</th>
                            <th style="padding: 10px 8px; text-align: left;">Found In</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 4px;">
                    <strong>Recommended Actions:</strong>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Check Seller Central for policy violation warnings</li>
                        <li>Review recent listing changes in the revision history</li>
                        <li>If sabotage suspected, file a Safe-T claim with Amazon</li>
                        <li>Update listings to remove flagged keywords if added by competitor</li>
                    </ol>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                Simply Solutions - Automated Listing Monitor
            </div>
        </body>
        </html>
    `;

    try {
        await resend.emails.send({
            from: 'Simply Solutions <alerts@simplysolutions.co.in>',
            to: adminEmail,
            subject: `⚠️ URGENT: ${flaggedProducts.length} Product(s) Have Flagged Keywords`,
            html
        });
        return true;
    } catch (error) {
        console.error('[monitor-listings] Failed to send alert email:', error);
        return false;
    }
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const logId = await logCronStart('monitor-listings');

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get seller accounts from database
        console.log('[monitor-listings] Getting seller accounts from database...');
        const accounts = await getActiveSellerAccounts();

        if (accounts.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No active seller accounts configured',
                duration: `${Date.now() - startTime}ms`
            }, { status: 500 });
        }

        // Use the first active account
        const account = accounts[0];
        console.log(`[monitor-listings] Using seller account: ${account.name}`);

        // Get access token using account credentials
        console.log('[monitor-listings] Getting access token...');
        const accessToken = await getAccessToken(account);

        // Get all ASINs from our mapping
        const asins = Object.entries(amazonAsinMap);
        console.log(`[monitor-listings] Scanning ${asins.length} products...`);

        const flaggedProducts: FlaggedResult[] = [];
        const scannedProducts: string[] = [];
        const errors: string[] = [];

        for (let i = 0; i < asins.length; i++) {
            const [productKey, asin] = asins[i];

            try {
                const catalogData = await fetchCatalogItem(accessToken, asin, account.marketplaceId);

                if (catalogData.error) {
                    errors.push(`${asin}: ${catalogData.error}`);
                    continue;
                }

                scannedProducts.push(asin);
                const flagged = scanProduct(asin, productKey, catalogData);

                if (flagged) {
                    flaggedProducts.push(flagged);
                    console.log(`[monitor-listings] ⚠️ FLAGGED: ${asin} - Keywords: ${flagged.flaggedKeywords.join(', ')}`);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (err: any) {
                errors.push(`${asin}: ${err.message}`);
            }
        }

        // Filter to only NEW flagged products (not in baseline)
        const newFlaggedProducts = flaggedProducts.filter(p => p.isNew);

        // Send alert only for NEW flagged products
        let alertSent = false;
        let pushSent = false;
        if (newFlaggedProducts.length > 0) {
            console.log(`[monitor-listings] 🚨 NEW ALERT: ${newFlaggedProducts.length} NEW products have flagged keywords!`);
            alertSent = await sendListingAlertEmail(newFlaggedProducts);

            // Send push notification to admins
            await sendPushToAdmins({
                title: '🚨 Listing Alert - NEW Flagged Keywords!',
                body: `${newFlaggedProducts.length} NEW product(s) have suspicious keywords. Check immediately!`,
                type: 'listing_alert',
                data: {
                    count: newFlaggedProducts.length,
                    products: newFlaggedProducts.map(p => p.asin)
                },
                tag: 'listing-monitor-alert'
            });
            pushSent = true;
        } else if (flaggedProducts.length > 0) {
            console.log(`[monitor-listings] ℹ️ ${flaggedProducts.length} baseline products have flagged keywords (ignored)`);
        }

        // Log to cron history
        await logCronSuccess(logId, scannedProducts.length, {
            scanned: scannedProducts.length,
            flagged: flaggedProducts.length,
            alertSent,
            flaggedProducts: flaggedProducts.map(p => ({ asin: p.asin, keywords: p.flaggedKeywords }))
        });

        // Also log to database for historical tracking (table may not exist)
        if (flaggedProducts.length > 0) {
            try {
                await supabase.from('listing_keyword_alerts').insert({
                    scanned_at: new Date().toISOString(),
                    products_scanned: scannedProducts.length,
                    products_flagged: flaggedProducts.length,
                    flagged_details: flaggedProducts,
                    alert_sent: alertSent
                });
            } catch {
                // Table might not exist, that's okay
            }
        }

        return NextResponse.json({
            success: true,
            message: newFlaggedProducts.length > 0
                ? `🚨 URGENT: ${newFlaggedProducts.length} NEW product(s) have flagged keywords!`
                : flaggedProducts.length > 0
                    ? `✅ ${flaggedProducts.length} baseline product(s) with known keywords (ignored)`
                    : '✅ All products clean - no flagged keywords detected',
            productsScanned: scannedProducts.length,
            productsFlagged: flaggedProducts.length,
            newProductsFlagged: newFlaggedProducts.length,
            baselineIgnored: flaggedProducts.length - newFlaggedProducts.length,
            newFlaggedProducts: newFlaggedProducts,
            allFlaggedProducts: flaggedProducts,
            alertSent,
            pushSent,
            errors: errors.length > 0 ? errors : undefined,
            duration: `${Date.now() - startTime}ms`
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logCronError(logId, errorMessage);
        return NextResponse.json({
            success: false,
            error: errorMessage,
            duration: `${Date.now() - startTime}ms`
        }, { status: 500 });
    }
}
