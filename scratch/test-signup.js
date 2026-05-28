const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
    console.log('Testing signup with standard client...');
    const email = `signup-user-${Date.now()}@example.com`;
    const password = 'Password123!';

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Standard Signup User'
            }
        }
    });

    if (error) {
        console.error('Signup error:', error);
    } else {
        console.log('Signup success:', data);
    }
}

test().catch(console.error);
