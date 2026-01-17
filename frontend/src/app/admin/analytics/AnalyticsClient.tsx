'use client'

import { useState } from 'react'
import {
    Users,
    UserCircle,
    Briefcase,
    CalendarCheck,
    Money,
    TrendUp,
    TrendDown,
    ChartLine,
    ChartBar,
    ChartPie,
    ArrowUp,
    ArrowDown,
    Coin,
    Clock,
    Download
} from '@phosphor-icons/react'
import { exportAnalyticsData } from '@/lib/admin/export-utils'
import { toast } from 'sonner'

interface StatsData {
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

interface ChartDataPoint {
    date: string
    count?: number
    amount?: number
}

interface PieDataPoint {
    name: string
    value: number
    color: string
}

interface AnalyticsClientProps {
    stats: StatsData
    userGrowthData: ChartDataPoint[]
    bookingTrendsData: ChartDataPoint[]
    revenueData: ChartDataPoint[]
    bookingStatusData: PieDataPoint[]
    userRoleData: PieDataPoint[]
}

// Simple line chart component with tooltips
function SimpleLineChart({
    data,
    dataKey,
    color,
    height = 200,
    hoveredPoint,
    onHover
}: {
    data: ChartDataPoint[]
    dataKey: 'count' | 'amount'
    color: string
    height?: number
    hoveredPoint?: { x: number; y: number; value: number; label: string } | null
    onHover?: (point: { x: number; y: number; value: number; label: string } | null) => void
}) {
    const values = data.map(d => d[dataKey] || 0)
    const maxValue = Math.max(...values, 1)
    const minValue = Math.min(...values)

    // Create SVG path
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((d[dataKey] || 0) / maxValue) * 80 - 10
        return { x, y, value: d[dataKey] || 0, label: d.date }
    })

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onHover) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Find closest point
        let closestPoint = points[0]
        let minDistance = Infinity

        points.forEach(point => {
            const distance = Math.abs(point.x - x)
            if (distance < minDistance) {
                minDistance = distance
                closestPoint = point
            }
        })

        onHover({
            x: e.clientX,
            y: e.clientY,
            value: closestPoint.value,
            label: closestPoint.label
        })
    }

    const handleMouseLeave = () => {
        if (onHover) onHover(null)
    }

    const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ')

    return (
        <div className="relative" style={{ height }}>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="100"
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="0.5"
                    />
                ))}

                {/* Area fill */}
                <polygon
                    points={`0,100 ${pathPoints} 100,100`}
                    fill={`url(#gradient-${color.replace('#', '')})`}
                />

                {/* Line */}
                <polyline
                    points={pathPoints}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Data points */}
                {points.map((point, i) => (
                    <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="2"
                        fill={color}
                        className="cursor-pointer hover:r-3 transition-all"
                    />
                ))}

                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
                <div
                    className="absolute pointer-events-none bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-sm z-10"
                    style={{
                        left: `${hoveredPoint.x}px`,
                        top: `${hoveredPoint.y - 40}px`,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <p className="text-white font-medium">{hoveredPoint.label}</p>
                    <p className="text-white/60">{hoveredPoint.value.toLocaleString()}</p>
                </div>
            )}

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-white/40 px-1">
                <span>{data[0]?.date}</span>
                <span>{data[Math.floor(data.length / 2)]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    )
}

// Simple bar chart component with enhanced tooltips
function SimpleBarChart({ data, color, height = 200 }: {
    data: ChartDataPoint[]
    color: string
    height?: number
}) {
    const values = data.map(d => d.amount || d.count || 0)
    const maxValue = Math.max(...values, 1)

    // Show only last 14 days for bar chart
    const recentData = data.slice(-14)

    return (
        <div className="relative" style={{ height }}>
            <div className="absolute inset-0 flex items-end justify-between gap-1 px-1 pb-5">
                {recentData.map((d, i) => {
                    const value = d.amount || d.count || 0
                    const heightPercent = (value / maxValue) * 100

                    return (
                        <div
                            key={i}
                            className="flex-1 rounded-t transition-all duration-300 hover:opacity-80 hover:scale-105 group relative cursor-pointer"
                            style={{
                                height: `${Math.max(heightPercent, 2)}%`,
                                backgroundColor: color,
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${d.date}: ${value.toLocaleString()}`}
                        >
                            {/* Enhanced Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                <p className="font-medium">{d.date}</p>
                                <p className="text-white/80">{value.toLocaleString()}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-white/40 px-1">
                <span>{recentData[0]?.date}</span>
                <span>{recentData[recentData.length - 1]?.date}</span>
            </div>
        </div>
    )
}

// Simple pie/donut chart component
function SimplePieChart({ data, size = 120 }: { data: PieDataPoint[], size?: number }) {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    if (total === 0) {
        return (
            <div className="flex items-center justify-center text-white/40 text-sm" style={{ width: size, height: size }}>
                No data
            </div>
        )
    }

    let currentAngle = -90

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox="0 0 100 100">
                {data.map((d, i) => {
                    const angle = (d.value / total) * 360
                    const startAngle = currentAngle
                    currentAngle += angle

                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = ((startAngle + angle) * Math.PI) / 180

                    const x1 = 50 + 40 * Math.cos(startRad)
                    const y1 = 50 + 40 * Math.sin(startRad)
                    const x2 = 50 + 40 * Math.cos(endRad)
                    const y2 = 50 + 40 * Math.sin(endRad)

                    const largeArc = angle > 180 ? 1 : 0

                    return (
                        <path
                            key={i}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={d.color}
                            stroke="black"
                            strokeWidth="1"
                            className="transition-opacity hover:opacity-80"
                        />
                    )
                })}
                {/* Center hole for donut effect */}
                <circle cx="50" cy="50" r="25" fill="black" />
            </svg>

            {/* Legend */}
            <div className="flex flex-col gap-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-white/70 text-xs">{d.name}</span>
                        <span className="text-white font-medium text-xs">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function AnalyticsClient({
    stats,
    userGrowthData,
    bookingTrendsData,
    revenueData,
    bookingStatusData,
    userRoleData,
}: AnalyticsClientProps) {
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('month')
    const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; value: number; label: string } | null>(null)

    const handleExport = () => {
        exportAnalyticsData(stats, userGrowthData, bookingTrendsData, revenueData)
        toast.success('Export Started', {
            description: 'Analytics data is being downloaded as CSV.'
        })
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Calculate growth percentages (mock for now - would need historical data)
    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Analytics</h1>
                    <p className="text-white/60 text-sm sm:text-base">Track platform performance and trends</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                        aria-label="Export analytics data to CSV"
                    >
                        <Download size={18} />
                        <span className="text-sm font-medium">Export CSV</span>
                    </button>

                    {/* Time Range Selector */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${timeRange === 'week'
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${timeRange === 'month'
                                    ? 'bg-[#df2531] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            This Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Total Users */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users size={18} className="text-blue-400 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm">Total Users</p>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                        <ArrowUp size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs">+{stats.weeklyUsers} this week</span>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <CalendarCheck size={18} className="text-purple-400 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm">Total Bookings</p>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalBookings.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                        <ArrowUp size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs">+{stats.weeklyBookings} this week</span>
                    </div>
                </div>

                {/* Revenue */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Money size={18} className="text-green-400 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm">Total Revenue</p>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{formatCurrency(stats.totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                        <ArrowUp size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs truncate">+{formatCurrency(stats.weeklyRevenue)} this week</span>
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#df2531]/10 flex items-center justify-center">
                            <TrendUp size={18} className="text-[#df2531] sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm">Completion Rate</p>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                        {stats.totalBookings > 0
                            ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                            : 0}%
                    </p>
                    <p className="text-white/40 text-xs mt-1 sm:mt-2">
                        {stats.completedBookings} of {stats.totalBookings} completed
                    </p>
                </div>
            </div>

            {/* Additional Metrics Row */}
            {(stats.averageBookingValue !== undefined || stats.peakHour !== undefined) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {stats.averageBookingValue !== undefined && (
                        <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Money size={18} className="text-purple-400 sm:w-5 sm:h-5" />
                                </div>
                                <p className="text-white/60 text-xs sm:text-sm">Avg Booking Value</p>
                            </div>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                {Math.round(stats.averageBookingValue).toLocaleString()}
                            </p>
                            <p className="text-white/40 text-xs mt-1 sm:mt-2">coins per booking</p>
                        </div>
                    )}

                    {stats.peakHour !== undefined && (
                        <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock size={18} className="text-amber-400 sm:w-5 sm:h-5" />
                                </div>
                                <p className="text-white/60 text-xs sm:text-sm">Peak Booking Hour</p>
                            </div>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                {stats.peakHour}:00
                            </p>
                            <p className="text-white/40 text-xs mt-1 sm:mt-2">Most active time</p>
                        </div>
                    )}
                </div>
            )}

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* User Growth Chart */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">User Growth</h3>
                            <p className="text-white/50 text-xs sm:text-sm">New signups over time</p>
                        </div>
                        <ChartLine size={20} className="text-blue-400 sm:w-6 sm:h-6" />
                    </div>
                    <SimpleLineChart
                        data={userGrowthData}
                        dataKey="count"
                        color="#3b82f6"
                        height={180}
                        hoveredPoint={hoveredDataPoint}
                        onHover={setHoveredDataPoint}
                    />
                </div>

                {/* Booking Trends Chart */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">Booking Trends</h3>
                            <p className="text-white/50 text-xs sm:text-sm">Daily bookings</p>
                        </div>
                        <ChartBar size={20} className="text-purple-400 sm:w-6 sm:h-6" />
                    </div>
                    <SimpleBarChart data={bookingTrendsData} color="#a855f7" height={180} />
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">Revenue Over Time</h3>
                            <p className="text-white/50 text-xs sm:text-sm">Daily revenue from coin purchases</p>
                        </div>
                        <Coin size={20} className="text-green-400 sm:w-6 sm:h-6" />
                    </div>
                    <SimpleLineChart
                        data={revenueData}
                        dataKey="amount"
                        color="#22c55e"
                        height={200}
                        hoveredPoint={hoveredDataPoint}
                        onHover={setHoveredDataPoint}
                    />
                </div>

                {/* Distribution Charts */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white">Distribution</h3>
                            <p className="text-white/50 text-xs sm:text-sm">Users & Bookings</p>
                        </div>
                        <ChartPie size={20} className="text-[#df2531] sm:w-6 sm:h-6" />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-white/60 text-xs mb-3">User Roles</p>
                            <SimplePieChart data={userRoleData} size={100} />
                        </div>

                        <div>
                            <p className="text-white/60 text-xs mb-3">Booking Status</p>
                            <SimplePieChart data={bookingStatusData} size={100} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <UserCircle size={16} className="text-blue-400" />
                        <span className="text-blue-400 text-xs font-medium">Clients</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">{stats.totalClients}</p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-[#df2531]/10 border border-[#df2531]/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Briefcase size={16} className="text-[#df2531]" />
                        <span className="text-[#df2531] text-xs font-medium">Talents</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">{stats.totalTalents}</p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarCheck size={16} className="text-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">Pending</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">{stats.pendingBookings}</p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarCheck size={16} className="text-green-400" />
                        <span className="text-green-400 text-xs font-medium">Completed</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">{stats.completedBookings}</p>
                </div>
            </div>
        </div>
    )
}
