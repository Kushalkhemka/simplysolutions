
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple CSV Parser to avoid external dependencies
export function parseCSV(filePath: string): any[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) return [];

    // Parse header
    const headers = parseLine(lines[0]);

    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);

        if (values.length !== headers.length) {
            // Handle cases where newlines might be inside quotes (simplistic approach: skip)
            // For this migration, we assume reasonably clean CSVs
            console.warn(`Skipping line ${i + 1}: Column count mismatch (${values.length} vs ${headers.length})`);
            continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        results.push(row);
    }

    return results;
}

function parseLine(line: string): string[] {
    const result = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                currentValue += '"';
                i++;
            } else {
                // Toggle quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of value
            result.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    result.push(currentValue);
    return result;
}

// Helper to remove Byte Order Mark (BOM) if present
export function cleanString(str: string): string {
    return str.replace(/^\uFEFF/, '').trim();
}
