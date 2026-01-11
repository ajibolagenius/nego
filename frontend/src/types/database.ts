// Database types matching Supabase schema

export type UserRole = 'client' | 'talent' | 'admin'
export type TalentStatus = 'online' | 'offline' | 'booked'
export type BookingStatus = 'payment_pending' | 'verification_pending' | 'confirmed' | 'completed' | 'cancelled'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  username: string | null
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
  is_verified: boolean
  status: TalentStatus
  starting_price: number | null
  created_at: string
  updated_at: string
}

export interface Wallet {
  user_id: string
  balance: number
  escrow_balance: number
}

export interface ServiceType {
  id: string
  name: string
  icon: string | null
  description: string | null
}

export interface TalentMenu {
  id: string
  talent_id: string
  service_type_id: string
  price: number
  is_active: boolean
  service_type?: ServiceType
}

export interface Booking {
  id: string
  client_id: string
  talent_id: string
  total_price: number
  services_snapshot: TalentMenu[]
  status: BookingStatus
  created_at: string
  client?: Profile
  talent?: Profile
}

export interface Verification {
  booking_id: string
  selfie_url: string
  full_name: string
  phone: string
  gps_coords: string | null
  admin_notes: string | null
  status: VerificationStatus
  created_at: string
}

export interface Media {
  id: string
  talent_id: string
  url: string
  type: 'image' | 'video'
  is_premium: boolean
  unlock_price: number
  created_at: string
}

// API Response types
export interface TalentWithMenu extends Profile {
  menu: TalentMenu[]
  media: Media[]
}
