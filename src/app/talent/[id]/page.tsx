import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTalentUrl } from '@/lib/talent-url'
import { Metadata } from 'next'
import { generateTalentOpenGraphMetadata } from '@/lib/og-metadata'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://negoempire.live'

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()

    const { data: talent } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url')
        .eq('id', id)
        .single()

    if (!talent) {
        return generateTalentOpenGraphMetadata('Talent Profile')
    }

    // avatar_url is already a full URL from Supabase storage or Cloudinary
    const talentImage = talent.avatar_url || undefined

    return generateTalentOpenGraphMetadata(
        talent.display_name || 'Talent Profile',
        talentImage,
        talent.username
    )
}

// Legacy route - redirects to new /t/[slug] format
export default async function TalentProfilePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch talent profile to get username/display_name for slug
    const { data: talent, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', id)
        .eq('role', 'talent')
        .single()

    if (error || !talent) {
        notFound()
    }

    // Redirect to the new slug-based URL
    const newUrl = getTalentUrl(talent)

    // Only redirect if the new URL is different (uses /t/ prefix)
    if (newUrl.startsWith('/t/')) {
        redirect(newUrl)
    }

    // If for some reason the talent URL still resolves to UUID format,
    // redirect back to /t/[id] which will handle it
    redirect(`/t/${id}`)
}
