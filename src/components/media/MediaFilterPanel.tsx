
'use client'

import { X, SortAscending, SortDescending, Image as ImageIcon, VideoCamera } from '@phosphor-icons/react'
import { SortOption, FilterOption } from './types'

interface MediaFilterPanelProps {
    show: boolean
    onClose: () => void
    sortBy: SortOption
    onSortChange: (sort: SortOption) => void
    filterBy: FilterOption
    onFilterChange: (filter: FilterOption) => void
}

export function MediaFilterPanel({
    show,
    onClose,
    sortBy,
    onSortChange,
    filterBy,
    onFilterChange
}: MediaFilterPanelProps) {
    if (!show) return null

    return (
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold text-sm">Filter & Sort Options</h4>
                <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white transition-colors"
                    aria-label="Close filters"
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>
            <div className="flex flex-wrap gap-4">
                {/* Sort By */}
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Sort By</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSortChange('newest')}
                            aria-pressed={sortBy === 'newest'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${sortBy === 'newest'
                                ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                }`}
                        >
                            <SortDescending size={16} weight="duotone" aria-hidden="true" />
                            Newest
                        </button>
                        <button
                            onClick={() => onSortChange('oldest')}
                            aria-pressed={sortBy === 'oldest'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${sortBy === 'oldest'
                                ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                }`}
                        >
                            <SortAscending size={16} weight="duotone" aria-hidden="true" />
                            Oldest
                        </button>
                    </div>
                </div>

                {/* Filter By Type */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Filter By Type</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onFilterChange('all')}
                            aria-pressed={filterBy === 'all'}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'all'
                                ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => onFilterChange('images')}
                            aria-pressed={filterBy === 'images'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'images'
                                ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                }`}
                        >
                            <ImageIcon size={16} weight="duotone" aria-hidden="true" />
                            Images
                        </button>
                        <button
                            onClick={() => onFilterChange('videos')}
                            aria-pressed={filterBy === 'videos'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#df2531] focus:ring-offset-2 focus:ring-offset-black ${filterBy === 'videos'
                                ? 'bg-[#df2531] text-white shadow-lg shadow-[#df2531]/20'
                                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                                }`}
                        >
                            <VideoCamera size={16} weight="duotone" aria-hidden="true" />
                            Videos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
