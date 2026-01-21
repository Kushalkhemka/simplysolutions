// Script to check and update user role to super_admin
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndUpdateRole() {
    const email = 'khemkakushal1206@gmail.com';

    console.log('Checking current role for:', email);

    // Get current role
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('email', email)
        .single();

    if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return;
    }

    console.log('Current profile:', profile);

    if (profile.role === 'super_admin') {
        console.log('✅ User is already super_admin!');
        return;
    }

    // Update to super_admin
    console.log('Updating role to super_admin...');
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('email', email)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating role:', updateError);
        return;
    }

    console.log('✅ Role updated successfully!', updated);
}

checkAndUpdateRole().catch(console.error);
