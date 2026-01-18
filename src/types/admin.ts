import type { Verification, WithdrawalRequest, Booking, Profile, Transaction } from './database'

/**
 * Admin-specific type extensions
 */

export interface VerificationWithBooking extends Verification {
    booking: BookingWithRelations | null
}

export interface BookingWithRelations extends Omit<Booking, 'client' | 'talent'> {
    client: Profile | null | undefined
    talent: Profile | null | undefined
}

export interface WithdrawalRequestWithTalent extends WithdrawalRequest {
    talent?: Profile | null
}

export interface PayoutTransaction extends Transaction {
    user?: Profile | null
}

export interface ChartDataPoint {
    date: string
    count?: number
    amount?: number
}

export interface PieChartDataPoint {
    name: string
    value: number
    color: string
}

export interface AdminStats {
    totalUsers: number
    totalClients: number
    totalTalents: number
    totalBookings: number
    pendingBookings: number
    completedBookings: number
    totalRevenue: number
    weeklyUsers: number
    weeklyBookings: number
    weeklyRevenue: number
    averageBookingValue?: number
    peakHour?: number
}

export interface TimeSeriesData {
    date: string
    count: number
}

export interface RevenueData {
    date: string
    amount: number
}
