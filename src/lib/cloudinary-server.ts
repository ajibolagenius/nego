import crypto from 'crypto'

export async function destroyCloudinaryAsset(
    publicId: string,
    resourceType: 'image' | 'video' = 'image'
): Promise<{ ok: boolean; details?: unknown }> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
        return { ok: false, details: 'Cloudinary configuration missing' }
    }

    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
    const signature = crypto
        .createHash('sha1')
        .update(paramsToSign + apiSecret)
        .digest('hex')

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
            body: formData.toString(),
        }
    )

    const result = await response.json()
    return {
        ok: result.result === 'ok' || result.result === 'not found',
        details: result,
    }
}
