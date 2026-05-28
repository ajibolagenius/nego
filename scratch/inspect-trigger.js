const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log('Fetching definition of handle_new_user function...');
    // We query pg_proc to get the function body (prosrc)
    const { data, error } = await supabase
        .from('pg_proc')
        .select('proname, prosrc')
        .eq('proname', 'handle_new_user');

    if (error) {
        console.error('Error fetching function:', error);
    } else {
        console.log('Found function handle_new_user:');
        console.log(data[0]?.prosrc);
    }
}

test().catch(console.error);
