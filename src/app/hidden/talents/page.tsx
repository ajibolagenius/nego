import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default async function HiddenTalentsPage() {
  const supabase = await createClient()

  // Fetch all female talents
  const { data: talents, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'talent')
    .eq('gender', 'female')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching female talents:', error)
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Failed to load talents.
      </div>
    )
  }

  if (!talents || talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <p className="text-xl">No female talents found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Female Talents</h1>
        <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
          {talents.length} Results
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {talents.map((talent) => (
          <Link href={`/hidden/talents/${talent.id}`} key={talent.id}>
            <div className="rounded-xl border shadow bg-zinc-900 border-zinc-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
              <div className="relative h-48 bg-zinc-800 w-full overflow-hidden">
                {talent.avatar_url ? (
                  <img 
                    src={talent.avatar_url} 
                    alt={talent.display_name || talent.full_name || 'Talent'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                    No Image
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="font-semibold text-white text-lg truncate">
                    {talent.display_name || talent.full_name || 'Anonymous'}
                  </h3>
                  {talent.username && (
                    <p className="text-zinc-300 text-sm">@{talent.username}</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {talent.location && (
                    <div className="flex items-center text-zinc-400 text-sm mb-2">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span className="truncate">{talent.location}</span>
                    </div>
                  )}
                  
                  {talent.bio && (
                    <p className="text-zinc-400 text-sm line-clamp-2 mt-2">
                      {talent.bio}
                    </p>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-indigo-400 font-medium">View Media</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">
                      {talent.status === 'online' ? (
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Online</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>Offline</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
