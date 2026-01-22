import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    // Get a sample row to see structure
    const { data, error } = await supabase
        .from('asin_fsn_mappings')
        .select('*')
        .limit(1);

    console.log('Sample row from asin_fsn_mappings:');
    console.log(data);
    console.log('Error:', error);
}

checkTable();
