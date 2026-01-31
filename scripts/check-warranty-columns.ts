import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkColumns() {
    console.log('Checking warranty_registrations columns...')

    const { data, error } = await supabase
        .from('warranty_registrations')
        .select('*')
        .limit(1)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    const columns = Object.keys(data?.[0] || {})
    console.log('Available columns:', columns)

    const hasReminderCount = columns.includes('reminder_count')
    const hasLastReminderSentAt = columns.includes('last_reminder_sent_at')

    console.log('\nReminder tracking columns:')
    console.log('- reminder_count:', hasReminderCount ? 'EXISTS' : 'MISSING')
    console.log('- last_reminder_sent_at:', hasLastReminderSentAt ? 'EXISTS' : 'MISSING')

    if (!hasReminderCount) {
        console.log('\n⚠️ Need to add reminder_count column via Supabase dashboard:')
        console.log('ALTER TABLE warranty_registrations ADD COLUMN reminder_count INTEGER DEFAULT 0;')
    }
}

checkColumns()
