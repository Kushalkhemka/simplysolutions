#!/usr/bin/env node

/**
 * Convert BBCode installation guides to Markdown
 * Run with: node scripts/convert-bbcode-to-markdown.mjs
 */

import fs from 'fs';
import path from 'path';

const guidesDir = './public/installation-guides';

// Convert BBCode to Markdown
function bbcodeToMarkdown(text) {
    let md = text;

    // Remove font and size tags (preserve content)
    md = md.replace(/\[size=\d+\]/gi, '');
    md = md.replace(/\[\/size\]/gi, '');
    md = md.replace(/\[font=[^\]]+\]/gi, '');
    md = md.replace(/\[\/font\]/gi, '');

    // Remove color tags (preserve content)
    md = md.replace(/\[color=[^\]]+\]/gi, '');
    md = md.replace(/\[\/color\]/gi, '');

    // Bold: [b]text[/b] -> **text**
    md = md.replace(/\[b\]\*?\*?/gi, '**');
    md = md.replace(/\*?\*?\[\/b\]/gi, '**');

    // Italic: [i]text[/i] -> *text*
    md = md.replace(/\[i\]/gi, '*');
    md = md.replace(/\[\/i\]/gi, '*');

    // Underline: [u]text[/u] -> **text** (markdown doesn't have underline)
    md = md.replace(/\[u\]/gi, '**');
    md = md.replace(/\[\/u\]/gi, '**');

    // Images: [img]url[/img] or [img=WxH]url[/img] -> ![](url)
    md = md.replace(/\[img=[^\]]*\]([^\[]+)\[\/img\]/gi, '![]($1)');
    md = md.replace(/\[img\]([^\[]+)\[\/img\]/gi, '![]($1)');

    // Center tags - just remove them
    md = md.replace(/\[center\]/gi, '');
    md = md.replace(/\[\/center\]/gi, '');

    // URL: [url=link]text[/url] -> [text](link)
    md = md.replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/gi, '[$2]($1)');
    md = md.replace(/\[url\]([^\[]+)\[\/url\]/gi, '[$1]($1)');

    // Clean up double asterisks that may result from nested tags
    md = md.replace(/\*\*\*\*/g, '**');
    md = md.replace(/\*\*\s+\*\*/g, ' ');

    // Clean up multiple newlines
    md = md.replace(/\n{3,}/g, '\n\n');

    // Clean up lines that are just whitespace
    md = md.split('\n').map(line => line.trim() === '' ? '' : line).join('\n');

    return md.trim();
}

// Main function
function main() {
    console.log('=== BBCode to Markdown Converter ===\n');

    const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} markdown files\n`);

    let converted = 0;

    for (const file of files) {
        const filePath = path.join(guidesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if file contains BBCode
        if (content.includes('[size=') || content.includes('[font=') || content.includes('[/b]')) {
            console.log(`Converting: ${file}`);

            const markdown = bbcodeToMarkdown(content);
            fs.writeFileSync(filePath, markdown);

            console.log(`  ✓ Converted`);
            converted++;
        } else {
            console.log(`Skipping: ${file} (already markdown)`);
        }
    }

    console.log(`\n=== Done ===`);
    console.log(`Converted: ${converted} files`);
}

main();
