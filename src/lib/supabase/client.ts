import { createBrowserClient } from '@supabase/ssr'

function create() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let client: ReturnType<typeof create> | undefined

// Single browser client per tab: multiple instances fight over the auth
// LockManager lock and make every caller's `supabase` identity unstable.
export function createClient() {
  client ??= create()
  return client
}
