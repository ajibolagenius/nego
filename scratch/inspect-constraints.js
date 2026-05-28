const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log('Attempting direct insert into public.profiles to catch constraints...');
    const testId = '00000000-0000-0000-0000-999999999999'; // Mock UUID
    
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: testId,
            role: 'client',
            display_name: 'Test Constraint User',
            full_name: 'Test Constraint User'
        })
        .select()
        .single();

    if (error) {
        console.error('INSERT FAILED with error:', error);
    } else {
        console.log('INSERT SUCCEEDED! Result:', data);
        // clean up
        await supabase.from('profiles').delete().eq('id', testId);
    }
}

test().catch(console.error);
