// Client-side Cloudflare R2 upload & delete utilities

export interface R2UploadResult {
    key: string
    url: string
    contentType: string
    size: number
}

/**
 * Streams a file directly to `/api/storage/upload` (backed by Cloudflare R2 `MEDIA_BUCKET`)
 * with real upload progress events.
 */
export async function uploadToR2(
    file: File,
    folder: string,
    onProgress?: (progress: number) => void
): Promise<R2UploadResult> {
    const params = new URLSearchParams({
        folder,
        filename: file.name || `upload_${Date.now()}`,
    })

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100))
                }
            })
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText) as R2UploadResult)
                } catch {
                    reject(new Error('Invalid upload response'))
                }
            } else {
                try {
                    const parsed = JSON.parse(xhr.responseText) as { error?: string }
                    reject(new Error(parsed.error || `Upload failed (${xhr.status})`))
                } catch {
                    reject(new Error(`Upload failed (${xhr.status})`))
                }
            }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.onabort = () => reject(new Error('Upload was cancelled'))

        xhr.open('POST', `/api/storage/upload?${params.toString()}`)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
    })
}

/**
 * Deletes an uploaded R2 object via `/api/storage/delete`.
 */
export async function deleteFromR2(urlOrKey: string): Promise<boolean> {
    const body = urlOrKey.startsWith('http') || urlOrKey.startsWith('/api/storage/object/')
        ? { url: urlOrKey }
        : { key: urlOrKey }

    const response = await fetch('/api/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        return false
    }

    const data = (await response.json()) as { success?: boolean }
    return Boolean(data.success)
}
