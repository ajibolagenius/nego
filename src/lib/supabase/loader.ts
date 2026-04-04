export default function supabaseLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Only transform Supabase storage URLs
  if (!src.includes('supabase.co')) return src

  // Use the built-in Supabase image transformation
  // Note: Only works on Pro plan, but harmless on Free plan (gets original)
  const params = new URLSearchParams()
  params.set('width', width.toString())
  params.set('quality', (quality || 75).toString())
  params.set('resize', 'contain')

  return `${src}?${params.toString()}`
}
