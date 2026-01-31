
export interface TalentMedia {
    id: string
    talent_id: string
    url: string
    type: 'image' | 'video'
    is_premium: boolean
    unlock_price: number
    created_at: string
}

export type MediaTab = 'free' | 'premium'
export type SortOption = 'newest' | 'oldest'
export type FilterOption = 'all' | 'images' | 'videos'
export type ViewMode = 'grid' | 'list'
