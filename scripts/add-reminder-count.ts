import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function addReminderCountColumn() {
    console.log('Adding reminder_count column to warranty_registrations...')

    // Use raw SQL via RPC or direct query
    const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE warranty_registrations ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;'
    })

    if (error) {
        // If RPC doesn't exist, we need to add it via Supabase dashboard
        console.log('Could not add column via RPC:', error.message)
        console.log('\n⚠️ Please add the column via Supabase dashboard SQL editor:')
        console.log('ALTER TABLE warranty_registrations ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;')

        // Alternative: Test by trying to update with the new column
        // This will fail but won't harm anything
        const { error: testError } = await supabase
            .from('warranty_registrations')
            .update({ reminder_count: 0 })
            .eq('id', 'non-existent-test-id')

        if (testError && testError.message.includes('reminder_count')) {
            console.log('\nColumn definitely does not exist. Please run the SQL in Supabase dashboard.')
        }
    } else {
        console.log('✅ Column added successfully!')
    }
}

addReminderCountColumn()
