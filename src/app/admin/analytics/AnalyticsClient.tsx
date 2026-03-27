'use client'

import {
    Download,
    Info,
    ArrowUp,
    Clock,
    Briefcase,
    XCircle,
    TrendUp
} from '@phosphor-icons/react'
import React, { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Tooltip } from '@/components/admin/Tooltip'
import { exportAnalyticsData } from '@/lib/admin/export-utils'

interface StatsData {
    totalUsers: number
    totalClients: number
    totalTalents: number
    totalBookings: number
    pendingBookings: number
    completedBookings: number
    totalRevenue: number
    totalEscrow: number
    pendingModeration: number
    avgVerificationTime: number
    weeklyUsers: number
    weeklyBookings: number
    weeklyRevenue: number
    averageBookingValue?: number
    peakHour?: number
    retentionRate?: number
    cancellationRate?: number
    totalProfileViews?: number
}

interface ChartDataPoint {
    date: string
    count?: number
    amount?: number
    value?: number
}

interface PieDataPoint {
    name: string
    value: number
    color?: string
}

interface AnalyticsClientProps {
    stats: StatsData
    userGrowthData: ChartDataPoint[]
    bookingTrendsData: ChartDataPoint[]
    revenueData: ChartDataPoint[]
    servicePopularityData: PieDataPoint[]
    locationData: PieDataPoint[]
    disputeDistribution: PieDataPoint[]
    topTalents: {
        id: string
        name: string
        avatar?: string | null
        revenue: number
    }[]
}

// Simple line chart component with tooltips
function SimpleLineChart({
    data,
    dataKey,
    color,
    height = 200,
    hoveredPoint,
    onHover,
    chartRef
}: {
    data: ChartDataPoint[]
    dataKey: 'count' | 'amount'
    color: string
    height?: number
    hoveredPoint?: { x: number; y: number; value: number; label: string } | null
    onHover?: (point: { x: number; y: number; value: number; label: string } | null) => void
    chartRef?: React.RefObject<SVGSVGElement | null>
}) {
    const values = data.map(d => d[dataKey] || 0)
    const maxValue = Math.max(...values, 1)

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

        if (closestPoint) {
            onHover({
                x: e.clientX,
                y: e.clientY,
                value: closestPoint.value,
                label: closestPoint.label
            })
        }
    }

    const handleMouseLeave = () => {
        if (onHover) onHover(null)
    }

    const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ')

    return (
        <div className="relative" style={{ height }}>
            <svg
                ref={chartRef}
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

    const slices = data.reduce((acc, d) => {
        const prevAngle = acc.length > 0 ? acc[acc.length - 1]!.endAngle : -90
        const angle = (d.value / total) * 360
        acc.push({
            ...d,
            startAngle: prevAngle,
            endAngle: prevAngle + angle,
            angle
        })
        return acc
    }, [] as Array<PieDataPoint & { startAngle: number, endAngle: number, angle: number }>)

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox="0 0 100 100">
                {slices.map((d, i) => {
                    const startRad = (d.startAngle * Math.PI) / 180
                    const endRad = (d.endAngle * Math.PI) / 180

                    const x1 = 50 + 40 * Math.cos(startRad)
                    const y1 = 50 + 40 * Math.sin(startRad)
                    const x2 = 50 + 40 * Math.cos(endRad)
                    const y2 = 50 + 40 * Math.sin(endRad)

                    const largeArc = d.angle > 180 ? 1 : 0

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
    servicePopularityData,
    locationData,
    disputeDistribution,
    topTalents,
}: AnalyticsClientProps) {
    const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; value: number; label: string } | null>(null)
    
    // Refs for chart export
    const revenueChartRef = useRef<SVGSVGElement>(null)

    const handleExport = () => {
        exportAnalyticsData(
            stats as unknown as Record<string, number>,
            userGrowthData as unknown as Record<string, unknown>[],
            bookingTrendsData as unknown as Record<string, unknown>[],
            revenueData as unknown as Record<string, unknown>[]
        )
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Platform Analytics</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-white/60 text-sm">Real-time insights across finance, demand, and operations</p>
                        <Tooltip content="Data aggregated from profiles, bookings, wallets, and transactions.">
                            <Info size={16} className="text-white/40 hover:text-white/60 cursor-help" />
                        </Tooltip>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                        <Download size={18} />
                        <span className="text-sm font-medium">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <ArrowUp size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs">+{formatCurrency(stats.weeklyRevenue)} this week</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Escrow Balance</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEscrow)}</p>
                    <p className="text-white/40 text-xs mt-2">Secured platform funds</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">{stats.totalBookings.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <ArrowUp size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs">+{stats.weeklyBookings} this week</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Profile Views</p>
                    <p className="text-2xl font-bold text-white">{stats.totalProfileViews?.toLocaleString() || "0"}</p>
                    <p className="text-white/40 text-xs mt-2">Measured platform engagement</p>
                </div>
            </div>

            {/* Operational Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-blue-400" />
                        <span className="text-blue-400 text-xs font-medium">Avg Verification Time</span>
                    </div>
                    <p className="text-white font-bold text-xl">{stats.avgVerificationTime.toFixed(1)}h</p>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Info size={16} className="text-orange-400" />
                        <span className="text-orange-400 text-xs font-medium">Moderation Backlog</span>
                    </div>
                    <p className="text-white font-bold text-xl">{stats.pendingModeration} pending</p>
                </div>

                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2 mb-1">
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-red-400 text-xs font-medium">Cancellation Rate</span>
                    </div>
                    <p className="text-white font-bold text-xl">{stats.cancellationRate?.toFixed(1)}%</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue/Growth Main Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Market Growth</h3>
                            <p className="text-white/50 text-sm">Revenue and User signups</p>
                        </div>
                        <TrendUp size={24} className="text-primary" />
                    </div>
                    <SimpleLineChart
                        data={revenueData}
                        dataKey="amount"
                        color="#df2531"
                        height={250}
                        hoveredPoint={hoveredDataPoint}
                        onHover={setHoveredDataPoint}
                        chartRef={revenueChartRef}
                    />
                </div>

                {/* Service Categories */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Service Popularity</h3>
                    <div className="flex flex-col items-center gap-6">
                        <SimplePieChart 
                            data={servicePopularityData.map((d, i) => ({ 
                                ...d, 
                                color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] 
                            }))} 
                            size={160} 
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Demand Heatmap List */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Location Distribution</h3>
                    <div className="space-y-4">
                        {locationData.length > 0 ? locationData.map((loc) => (
                            <div key={loc.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">{loc.name}</span>
                                    <span className="text-white/40">{loc.value} users</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5">
                                    <div
                                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(loc.value / (locationData[0]?.value || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-8 text-white/40 italic">Not enough location data</p>
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Top Revenue Talents</h3>
                        <Briefcase size={20} className="text-primary" />
                    </div>
                    <div className="space-y-4">
                        {topTalents.map((talent, i) => (
                            <div key={talent.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-white/20 font-bold w-4">{i + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/20">
                                        {talent.avatar ? (
                                            <img src={talent.avatar} alt={talent.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                                                {talent.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{talent.name}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Verified Talent</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-400">{formatCurrency(talent.revenue)}</p>
                                    <p className="text-[10px] text-white/30">Total Generated</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Governance Section */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-white">Governance & Disputes</h3>
                        <p className="text-sm text-white/50">Marketplace friction analysis</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <XCircle size={20} className="text-red-400" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="flex justify-center md:justify-start">
                        <SimplePieChart 
                            data={disputeDistribution} 
                            size={180} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {disputeDistribution.map((item) => (
                            <div key={item.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">{item.name}</p>
                                <p className="text-2xl font-bold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
