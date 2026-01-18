/**
 * Utilities for exporting charts as images
 */

/**
 * Export SVG element as PNG
 */
export async function exportChartAsPNG(
    svgElement: SVGSVGElement,
    filename: string,
    width: number = 1200,
    height: number = 600
): Promise<void> {
    try {
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

        // Set explicit dimensions
        clonedSvg.setAttribute('width', width.toString())
        clonedSvg.setAttribute('height', height.toString())
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`)

        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(clonedSvg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        // Create image from SVG
        const img = new Image()
        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('Could not get canvas context')
            }

            // Fill background (important for dark themes)
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, width, height)

            // Draw image
            ctx.drawImage(img, 0, 0, width, height)

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) {
                    throw new Error('Failed to create blob')
                }

                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                URL.revokeObjectURL(svgUrl)
            }, 'image/png')
        }

        img.onerror = () => {
            throw new Error('Failed to load SVG image')
        }

        img.src = svgUrl
    } catch (error) {
        console.error('Error exporting chart as PNG:', error)
        throw error
    }
}

/**
 * Export SVG element as SVG file
 */
export function exportChartAsSVG(svgElement: SVGSVGElement, filename: string): void {
    try {
        // Clone the SVG
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

        // Set explicit dimensions if not set
        if (!clonedSvg.getAttribute('width')) {
            clonedSvg.setAttribute('width', '1200')
        }
        if (!clonedSvg.getAttribute('height')) {
            clonedSvg.setAttribute('height', '600')
        }

        // Serialize SVG
        const svgData = new XMLSerializer().serializeToString(clonedSvg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        // Download
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.svg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error('Error exporting chart as SVG:', error)
        throw error
    }
}

/**
 * Export canvas-based chart as PNG
 */
export function exportCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
    try {
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create blob')
            }

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }, 'image/png')
    } catch (error) {
        console.error('Error exporting canvas as PNG:', error)
        throw error
    }
}
