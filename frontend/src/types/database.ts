// Database types matching Supabase schema

export type UserRole = 'client' | 'talent' | 'admin'
export type TalentStatus = 'online' | 'offline' | 'booked'
export type BookingStatus = 'payment_pending' | 'verification_pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'booking_completed' | 'booking_expired' | 'withdrawal_approved' | 'withdrawal_rejected' | 'general'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed'

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

// Alias for ServiceType
export type Service = ServiceType

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
  scheduled_at: string | null
  notes: string | null
  created_at: string
  client?: Profile
  talent?: Profile
}

export interface Verification {
  id: string
  booking_id: string
  selfie_url: string | null
  full_name: string | null
  phone: string | null
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

export type TransactionType = 'purchase' | 'unlock' | 'booking' | 'refund' | 'payout' | 'withdrawal'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Transaction {
  id: string
  user_id: string
  amount: number
  coins: number
  type: TransactionType
  status: TransactionStatus
  reference: string | null
  reference_id: string | null
  description: string | null
  created_at: string
  updated_at?: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface WithdrawalRequest {
  id: string
  talent_id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: WithdrawalStatus
  admin_notes: string | null
  processed_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  booking_id: string | null
  last_message_at: string
  created_at: string
  // Joined data
  other_user?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  // Joined data
  sender?: Profile
}

// API Response types
export interface TalentWithMenu extends Profile {
  menu: TalentMenu[]
  media: Media[]
}
