(async () => {
    const [{ default: dotenv }, { createClient }] = await Promise.all([
        import('dotenv'),
        import('@supabase/supabase-js'),
    ])

    dotenv.config({ path: '.env.local' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase environment variables')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: users, error } = await supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            wallets (
                balance,
                escrow_balance
            )
        `)
        .eq('id', 'd2b4c010-d098-4d67-9e8a-6bfd9406b69d')

    console.log('Error:', error)
    console.log('Data:', JSON.stringify(users, null, 2))
})()
    .catch((error) => {
        console.error('Test fetch failed:', error)
        process.exit(1)
    })
