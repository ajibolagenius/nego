import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

// Allowed folders for uploads
const ALLOWED_FOLDERS = ['users', 'talents', 'media', 'avatars', 'profiles']

export async function GET(request: NextRequest) {
  try {
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
    if (!ALLOWED_FOLDERS.includes(folderBase) && folderBase !== 'uploads') {
      return NextResponse.json(
        { error: 'Invalid folder path' },
        { status: 400 }
      )
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    
    const paramsToSign = {
      timestamp,
      folder,
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
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
