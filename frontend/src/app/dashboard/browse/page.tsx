import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrowseClient } from './BrowseClient'

export default async function BrowsePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch talents
  const { data: talents } = await supabase
    .from('profiles')
    .select(`
      *,
      talent_menus (
        id,
        price,
        is_active,
        service_type:service_types (
          id,
          name,
          icon
        )
      )
    `)
    .eq('role', 'talent')
    .order('created_at', { ascending: false })

  // Fetch service types for filter
  const { data: serviceTypes } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_active', true)

  return <BrowseClient talents={talents || []} serviceTypes={serviceTypes || []} />
}
