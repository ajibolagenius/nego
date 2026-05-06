import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Profile } from '@/types/database'

interface TalentWithStats extends Profile {
  total_media: number;
  premium_media: number;
  free_media: number;
}

export default async function HiddenTalentsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const pageStr = searchParams.page;
  const page = typeof pageStr === 'string' ? parseInt(pageStr, 10) : 1;
  const pageSize = 12;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const supabase = await createClient()

  // Fetch all female talents from the new stats view
  const { data, error, count } = await supabase
    .from('female_talents_with_media_stats')
    .select('*', { count: 'exact' })
    .order('total_media', { ascending: false })
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    console.error('Error fetching female talents:', error)
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Failed to load talents. Please make sure the SQL view is created in Supabase.
      </div>
    )
  }

  const talents = data as TalentWithStats[] | null;
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (!talents || talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <p className="text-xl">No female talents found on this page.</p>
        {page > 1 && (
          <Link href="/hidden/talents" className="mt-4 text-indigo-400 hover:text-indigo-300">
            Return to first page
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Female Talents</h1>
        <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
          {totalItems} Results
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {talents.map((talent) => (
          <Link href={`/hidden/talents/${talent.id}`} key={talent.id}>
            <div className="rounded-xl border shadow bg-zinc-900 border-zinc-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer h-full flex flex-col relative">
              
              {/* Media Badges overlay */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 pointer-events-none">
                {talent.total_media > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-sm flex items-center gap-1 w-fit">
                      <ImageIcon className="h-3 w-3" /> {talent.total_media} Total
                    </span>
                    {(talent.premium_media > 0 || talent.free_media > 0) && (
                      <div className="flex gap-1">
                        {talent.premium_media > 0 && (
                          <span className="bg-amber-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {talent.premium_media} PRO
                          </span>
                        )}
                        {talent.free_media > 0 && (
                          <span className="bg-green-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {talent.free_media} FREE
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  <span className="text-indigo-400 font-medium">View Portfolio</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-zinc-800">
          {page > 1 ? (
            <Link 
              href={`/hidden/talents?page=${page - 1}`}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Link>
          ) : (
            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-800/50 text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Previous
            </div>
          )}
          
          <span className="text-zinc-400 text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          
          {page < totalPages ? (
            <Link 
              href={`/hidden/talents?page=${page + 1}`}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-800/50 text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
