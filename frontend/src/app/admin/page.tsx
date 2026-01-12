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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-white/60">Manage verifications, payouts, and platform settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`relative p-6 rounded-2xl bg-white/5 border transition-all duration-300 hover:bg-white/10 ${
                stat.urgent ? 'border-amber-500/50' : 'border-white/10'
              }`}
            >
              {stat.urgent && (
                <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              )}
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                <Icon size={24} weight="duotone" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/verifications"
            className="px-4 py-2 rounded-xl bg-[#df2531] text-white font-medium hover:bg-[#c41f2a] transition-colors"
          >
            Review Verifications
          </Link>
          <Link
            href="/admin/payouts"
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Process Payouts
          </Link>
        </div>
      </div>
    </div>
  )
}
