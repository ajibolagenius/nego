import { NextRequest, NextResponse } from 'next/server'

// Allowed folders for uploads
const ALLOWED_FOLDERS = ['users', 'talents', 'media', 'avatars', 'profiles', 'uploads']

// SHA1 hash using Web Crypto API (works in Edge runtime)
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing', details: { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret } },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const resourceType = searchParams.get('resource_type') || 'image'
    const folder = searchParams.get('folder') || 'uploads'

    // Validate resource type
    if (!['image', 'video'].includes(resourceType)) {
      return NextResponse.json(
        { error: 'Invalid resource type. Must be "image" or "video"' },
        { status: 400 }
      )
    }

    // Validate folder (basic security check)
    const folderBase = folder.split('/')[0] ?? ''
    if (!folderBase || !ALLOWED_FOLDERS.includes(folderBase)) {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 400 }
      )
    }

    const timestamp = Math.round(new Date().getTime() / 1000)

    // Create signature using Web Crypto API
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
    const signature = await sha1(paramsToSign + apiSecret)

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: cloudName,
      api_key: apiKey,
      folder,
      resource_type: resourceType
    })
  } catch (error) {
    console.error('Cloudinary signature error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature', details: String(error) },
      { status: 500 }
    )
  }
}

// Ensure this runs on Edge runtime for better compatibility
export const runtime = 'edge'
