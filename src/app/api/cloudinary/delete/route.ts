import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SHA1 hash using Web Crypto API
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    // Get auth token from cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const authToken = cookieHeader.split(';').find(c => c.trim().startsWith('sb-'))
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 })
    }

    const body = await request.json()
    const { publicId, resourceType = 'image' } = body

    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Create signature for deletion
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
    const signature = await sha1(paramsToSign + apiSecret)

    // Call Cloudinary destroy API
    const formData = new URLSearchParams()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp.toString())
    formData.append('api_key', apiKey)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }
    )

    const result = await response.json()

    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Failed to delete asset', details: result },
      { status: 500 }
    )
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
