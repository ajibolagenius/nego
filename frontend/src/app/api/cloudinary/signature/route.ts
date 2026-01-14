import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Allowed folders for uploads
const ALLOWED_FOLDERS = ['users', 'talents', 'media', 'avatars', 'profiles', 'uploads']

export async function GET(request: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary configuration missing' },
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
    const folderBase = folder.split('/')[0]
    if (!ALLOWED_FOLDERS.includes(folderBase)) {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 400 }
      )
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // Create signature manually without SDK
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex')

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
      { error: 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
