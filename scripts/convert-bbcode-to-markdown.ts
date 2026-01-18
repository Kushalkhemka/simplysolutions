import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'product-assets';
const FOLDER_NAME = 'installation-guide-images';
const DOCS_DIR = '/Users/kushalkhemka/Desktop/ECOM/installation_docs';
const OUTPUT_DIR = '/Users/kushalkhemka/Desktop/ECOM/simplysolutions/public/installation-guides';

// Download image from URL
async function downloadImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
        let fullUrl = url;
        if (url.startsWith('//')) {
            fullUrl = 'https:' + url;
        }

        const protocol = fullUrl.startsWith('https') ? https : http;

        protocol.get(fullUrl, { timeout: 10000 }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadImage(redirectUrl).then(resolve);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                console.log(`    Failed to download: ${response.statusCode}`);
                resolve(null);
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', () => resolve(null));
        }).on('error', (err) => {
            console.log(`    Download error: ${err.message}`);
            resolve(null);
        });
    });
}

// Extract extension from URL
function getExtension(url: string): string {
    const match = url.match(/\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i);
    if (match) return match[1].toLowerCase();
    return 'jpg';
}

// Generate unique filename for image
function generateImageFilename(docName: string, index: number, url: string): string {
    const ext = getExtension(url);
    return `${docName}_img${index + 1}.${ext}`;
}

// Convert BBCode to Markdown
function convertBBCodeToMarkdown(content: string, imageMap: Map<string, string>): string {
    let md = content;

    // Replace images with Supabase URLs
    md = md.replace(/\[img(?:=(\d+)x(\d+))?\](.*?)\[\/img\]/gi, (match, width, height, url) => {
        const supabaseUrl = imageMap.get(url.trim());
        if (supabaseUrl) {
            return `![](${supabaseUrl})`;
        }
        return `![](${url.trim()})`;
    });

    // Convert BBCode tags to Markdown
    // Bold
    md = md.replace(/\[b\](.*?)\[\/b\]/gi, '**$1**');

    // Italic
    md = md.replace(/\[i\](.*?)\[\/i\]/gi, '*$1*');

    // Underline (use bold in MD since no native underline)
    md = md.replace(/\[u\](.*?)\[\/u\]/gi, '**$1**');

    // Links
    md = md.replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '[$2]($1)');
    md = md.replace(/\[url\](.*?)\[\/url\]/gi, '[$1]($1)');

    // Headers via size tags
    md = md.replace(/\[size=4\](.*?)\[\/size\]/gi, '## $1');
    md = md.replace(/\[size=3\](.*?)\[\/size\]/gi, '$1');
    md = md.replace(/\[size=2\](.*?)\[\/size\]/gi, '$1');

    // Colors - convert red to warning, remove others
    md = md.replace(/\[color=#ff0000\](.*?)\[\/color\]/gi, '> ⚠️ $1');
    md = md.replace(/\[color=#e03e2d\](.*?)\[\/color\]/gi, '> ⚠️ $1');
    md = md.replace(/\[color=[^\]]*\](.*?)\[\/color\]/gi, '$1');

    // Font tags - remove
    md = md.replace(/\[font=[^\]]*\](.*?)\[\/font\]/gi, '$1');

    // Alignment - remove (not supported in basic MD)
    md = md.replace(/\[center\](.*?)\[\/center\]/gis, '$1');
    md = md.replace(/\[left\](.*?)\[\/left\]/gis, '$1');
    md = md.replace(/\[right\](.*?)\[\/right\]/gis, '$1');

    // Horizontal rule
    md = md.replace(/\[hr\]/gi, '\n---\n');

    // Clean up multiple newlines
    md = md.replace(/\n{3,}/g, '\n\n');

    // Clean up any remaining empty BBCode tags
    md = md.replace(/\[\/?[a-z]+[^\]]*\]/gi, '');

    return md.trim();
}

// Extract all image URLs from BBCode content
function extractImageUrls(content: string): string[] {
    const regex = /\[img(?:=\d+x\d+)?\](.*?)\[\/img\]/gi;
    const urls: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        urls.push(match[1].trim());
    }

    return urls;
}

async function processDoc(filename: string): Promise<void> {
    const docPath = path.join(DOCS_DIR, filename);
    const docName = path.basename(filename, '.md');

    console.log(`\nProcessing: ${filename}`);

    // Read BBCode content
    const content = fs.readFileSync(docPath, 'utf-8');

    // Extract all image URLs
    const imageUrls = extractImageUrls(content);
    console.log(`  Found ${imageUrls.length} images`);

    // Upload images and build URL map
    const imageMap = new Map<string, string>();

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        console.log(`  Uploading image ${i + 1}/${imageUrls.length}...`);

        const imageData = await downloadImage(url);
        if (!imageData) {
            console.log(`    Skipping failed image`);
            continue;
        }

        const filename = generateImageFilename(docName, i, url);
        const storagePath = `${FOLDER_NAME}/${filename}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, imageData, {
                contentType: `image/${getExtension(url) === 'jpg' ? 'jpeg' : getExtension(url)}`,
                upsert: true,
            });

        if (error) {
            console.log(`    Upload error: ${error.message}`);
            continue;
        }

        const supabaseImageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
        imageMap.set(url, supabaseImageUrl);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
    }

    // Convert BBCode to Markdown
    const markdown = convertBBCodeToMarkdown(content, imageMap);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write converted Markdown
    const outputPath = path.join(OUTPUT_DIR, `${docName}.md`);
    fs.writeFileSync(outputPath, markdown);

    console.log(`  ✓ Converted to: ${outputPath}`);
}

async function main() {
    console.log('BBCode to Markdown Converter');
    console.log('============================\n');

    // Get all .md files in docs directory
    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

    console.log(`Found ${files.length} docs to convert`);

    let successCount = 0;

    for (const file of files) {
        try {
            await processDoc(file);
            successCount++;
        } catch (err) {
            console.error(`  Error processing ${file}:`, err);
        }
    }

    console.log('\n============================');
    console.log(`Converted: ${successCount}/${files.length} docs`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
