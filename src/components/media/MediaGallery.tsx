
'use client'

import Image from 'next/image'
import {
    Image as ImageIcon, Trash, SpinnerGap, Crown, VideoCamera
} from '@phosphor-icons/react'
import { TalentMedia, ViewMode } from './types'
import { isVideo } from '@/lib/media-utils'

interface MediaGalleryProps {
    items: TalentMedia[]
    viewMode: ViewMode
    deletingId: string | null
    onDelete: (item: TalentMedia) => void
}

export function MediaGallery({ items, viewMode, deletingId, onDelete }: MediaGalleryProps) {
    if (viewMode === 'list') {
        return (
            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                        data-testid={`media-item-${item.id}`}
                    >
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 relative">
                            {isVideo(item.url) ? (
                                <video src={item.url} className="w-full h-full object-cover" muted aria-label="Video thumbnail" />
                            ) : (
                                <Image
                                    src={item.url}
                                    alt={`${item.is_premium ? 'Premium' : 'Free'} ${item.type}`}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                />
                            )}
                            {item.is_premium && (
                                <div className="absolute top-1 right-1">
                                    <Crown size={14} weight="fill" className="text-amber-400" aria-hidden="true" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                {isVideo(item.url) ? (
                                    <VideoCamera size={16} weight="duotone" className="text-purple-400" aria-hidden="true" />
                                ) : (
                                    <ImageIcon size={16} weight="duotone" className="text-blue-400" aria-hidden="true" />
                                )}
                                <span className="text-white font-medium text-sm">
                                    {isVideo(item.url) ? 'Video' : 'Image'}
                                </span>
                                {item.is_premium && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
                                        {item.unlock_price} coins
                                    </span>
                                )}
                            </div>
                            <p className="text-white/50 text-xs">
                                Uploaded {new Date(item.created_at).toLocaleDateString('en-NG', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => onDelete(item)}
                            disabled={deletingId === item.id}
                            aria-label={`Delete ${item.is_premium ? 'premium' : 'free'} ${item.type}`}
                            className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                        >
                            {deletingId === item.id ? (
                                <SpinnerGap size={18} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Trash size={18} weight="duotone" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        )
    }

    // Grid View
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 hover:border-[#df2531]/30 transition-all"
                    data-testid={`media-item-${item.id}`}
                >
                    {isVideo(item.url) ? (
                        <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                            aria-label={`${item.is_premium ? 'Premium' : 'Free'} video`}
                        />
                    ) : (
                        <Image
                            src={item.url}
                            alt={`${item.is_premium ? 'Premium' : 'Free'} content`}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                        />
                    )}

                    {/* Premium Badge */}
                    {item.is_premium && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/30">
                            <Crown size={14} weight="fill" aria-hidden="true" />
                            {item.unlock_price} coins
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={() => onDelete(item)}
                            disabled={deletingId === item.id}
                            aria-label={`Delete ${item.is_premium ? 'premium' : 'free'} ${item.type}`}
                            className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
                        >
                            {deletingId === item.id ? (
                                <SpinnerGap size={20} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Trash size={20} weight="duotone" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
