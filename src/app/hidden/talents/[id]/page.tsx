import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LockOpen, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function HiddenTalentMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Fetch talent details using normal client
  const { data: talent, error: talentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (talentError || !talent) {
    console.error('Error fetching talent:', talentError)
    notFound()
  }

  // Fetch all media for this talent, bypassing premium restrictions using admin client
  const adminSupabase = (await import('@/lib/supabase/api')).createApiClient()
  const { data: media, error: mediaError } = await adminSupabase
    .from('media')
    .select('*')
    .eq('talent_id', resolvedParams.id)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (mediaError) {
    console.error('Error fetching media:', mediaError)
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="border-zinc-800 hover:bg-zinc-800 text-zinc-300">
          <Link href="/hidden/talents">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Talent Portfolio</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
          {talent.avatar_url ? (
            <img src={talent.avatar_url} alt={talent.full_name || 'Avatar'} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-500">No Image</div>
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold">{talent.display_name || talent.full_name || 'Anonymous'}</h2>
            {talent.username && <span className="text-zinc-400">@{talent.username}</span>}
            <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2 py-1 rounded-full border border-indigo-600/30 flex items-center gap-1">
              <LockOpen className="h-3 w-3" /> All Access
            </span>
          </div>
          
          {talent.location && (
            <div className="flex items-center text-zinc-400 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {talent.location}
            </div>
          )}
          
          {talent.bio && (
            <p className="text-zinc-300 mt-2 max-w-3xl">{talent.bio}</p>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="text-xl font-semibold">Media Gallery</h3>
          <span className="text-sm text-zinc-400">{media?.length || 0} items</span>
        </div>

        {!media || media.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
            No media found for this talent.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group">
                {item.type === 'video' ? (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="Talent Media" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    loading="lazy"
                  />
                )}
                
                {item.is_premium && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                    PREMIUM
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
