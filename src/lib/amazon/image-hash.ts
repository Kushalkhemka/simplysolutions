/**
 * Image Hash Utility
 * 
 * Computes MD5 hash of image content for detecting changes.
 * Used by the listing keyword monitor to track image tampering.
 */

import crypto from 'crypto';

export interface ImageHashResult {
    url: string;
    hash: string | null;
    error?: string;
}

/**
 * Fetch an image and compute its MD5 hash
 */
export async function computeImageHash(imageUrl: string): Promise<ImageHashResult> {
    try {
        // Fetch the image with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SimplySolutions/1.0)',
                'Accept': 'image/*'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return {
                url: imageUrl,
                hash: null,
                error: `HTTP ${response.status}`
            };
        }

        // Get image as buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Compute MD5 hash
        const hash = crypto.createHash('md5').update(buffer).digest('hex');

        return {
            url: imageUrl,
            hash
        };
    } catch (error) {
        return {
            url: imageUrl,
            hash: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Fetch and hash multiple images
 */
export async function computeMultipleImageHashes(imageUrls: string[]): Promise<ImageHashResult[]> {
    // Process in parallel but with concurrency limit
    const results: ImageHashResult[] = [];
    const batchSize = 3; // Max 3 concurrent requests

    for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(url => computeImageHash(url)));
        results.push(...batchResults);
    }

    return results;
}

/**
 * Compare two hashes and determine if image changed
 */
export function hasImageChanged(oldHash: string | null, newHash: string | null): boolean {
    // If either is null, we can't determine change
    if (!oldHash || !newHash) return false;
    return oldHash !== newHash;
}
