'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Media } from '@/types/database'

export function MediaLightbox({ media }: { media: Media[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
    document.body.style.overflow = '' // Restore background scrolling
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map((item, index) => (
          <div 
            key={item.id} 
            className="relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {item.type === 'video' ? (
              <video 
                src={item.url} 
                className="w-full h-full object-cover"
                preload="metadata"
                // Don't auto-play in the grid
              />
            ) : (
              <img 
                src={item.url} 
                alt="Talent Media" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                loading="lazy"
              />
            )}
            
            {/* Play icon overlay for videos */}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                </div>
              </div>
            )}
            
            {item.is_premium && (
              <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                PREMIUM
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors z-50"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          <button 
            className={`absolute left-4 sm:left-10 p-3 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors z-50 ${selectedIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToPrev}
            disabled={selectedIndex === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Main Media Container */}
          <div 
            className="relative w-full h-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-12"
            onClick={(e) => e.stopPropagation()} // Prevent clicks on media from closing the modal
          >
            {media[selectedIndex]!.type === 'video' ? (
              <video 
                src={media[selectedIndex]!.url} 
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl ring-1 ring-white/10"
                controls
                autoPlay
              />
            ) : (
              <img 
                src={media[selectedIndex]!.url} 
                alt="Enlarged media" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
              />
            )}

            {/* Media info */}
            <div className="absolute bottom-4 flex flex-col items-center gap-2">
              <span className="text-zinc-400 text-sm">
                {selectedIndex + 1} of {media.length}
              </span>
              {media[selectedIndex]!.is_premium && (
                <span className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow-sm">
                  PREMIUM
                </span>
              )}
            </div>
          </div>

          {/* Next button */}
          <button 
            className={`absolute right-4 sm:right-10 p-3 rounded-full bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors z-50 ${selectedIndex === media.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={goToNext}
            disabled={selectedIndex === media.length - 1}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  )
}
