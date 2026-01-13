import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserCheck, Money, Users, CalendarCheck } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Admin Dashboard - Nego',
  description: 'Nego Admin Dashboard',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: pendingVerifications },
    { count: totalUsers },
    { count: totalBookings },
    { count: pendingPayouts },
  ] = await Promise.all([
    supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'payout').eq('status', 'pending'),
  ])

  const stats = [
    {
      label: 'Pending Verifications',
      value: pendingVerifications || 0,
      icon: UserCheck,
      href: '/admin/verifications',
      color: 'bg-amber-500/10 text-amber-400',
      urgent: (pendingVerifications || 0) > 0,
    },
    {
      label: 'Pending Payouts',
      value: pendingPayouts || 0,
      icon: Money,
      href: '/admin/payouts',
      color: 'bg-green-500/10 text-green-400',
      urgent: (pendingPayouts || 0) > 0,
    },
    {
      label: 'Total Users',
      value: totalUsers || 0,
      icon: Users,
      href: '#',
      color: 'bg-blue-500/10 text-blue-400',
      urgent: false,
    },
    {
      label: 'Total Bookings',
      value: totalBookings || 0,
      icon: CalendarCheck,
      href: '#',
      color: 'bg-purple-500/10 text-purple-400',
      urgent: false,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Admin Dashboard</h1>
        <p className="text-white/60 text-sm sm:text-base">Manage verifications, payouts, and platform settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`relative p-4 sm:p-6 rounded-2xl bg-white/5 border transition-all duration-300 hover:bg-white/10 ${
                stat.urgent ? 'border-amber-500/50' : 'border-white/10'
              }`}
            >
              {stat.urgent && (
                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 animate-pulse" />
              )}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3 sm:mb-4`}>
                <Icon size={20} weight="duotone" className="sm:w-6 sm:h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/60 text-xs sm:text-sm">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href="/admin/verifications"
            className="px-3 sm:px-4 py-2 rounded-xl bg-[#df2531] text-white text-sm font-medium hover:bg-[#c41f2a] transition-colors"
          >
            Review Verifications
          </Link>
          <Link
            href="/admin/payouts"
            className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Process Payouts
          </Link>
          <Link
            href="/admin/analytics"
            className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}
