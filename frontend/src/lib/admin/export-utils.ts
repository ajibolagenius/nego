/**
 * Utility functions for exporting admin data to CSV
 */

export interface ExportableData {
    [key: string]: string | number | null | undefined
}

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: ExportableData[], headers: string[]): string {
    // Create header row
    const headerRow = headers.map(h => `"${h}"`).join(',')

    // Create data rows
    const dataRows = data.map(row => {
        return headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return '""'
            // Escape quotes and wrap in quotes
            const stringValue = String(value).replace(/"/g, '""')
            return `"${stringValue}"`
        }).join(',')
    })

    return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

/**
 * Export verifications to CSV
 */
export function exportVerifications(verifications: any[]): void {
    const headers = [
        'Booking ID',
        'Client Name',
        'Phone',
        'Status',
        'Submitted Date',
        'Admin Notes',
        'Booking Amount',
        'Booking Status'
    ]

    const csvData = verifications.map(v => ({
        'Booking ID': v.booking_id.slice(0, 8),
        'Client Name': v.full_name || v.booking?.client?.display_name || 'Unknown',
        'Phone': v.phone || 'N/A',
        'Status': v.status,
        'Submitted Date': new Date(v.created_at).toLocaleString('en-NG'),
        'Admin Notes': v.admin_notes || 'N/A',
        'Booking Amount': v.booking?.total_price || 0,
        'Booking Status': v.booking?.status || 'N/A'
    }))

    const csv = convertToCSV(csvData, headers)
    downloadCSV(csv, 'verifications')
}

/**
 * Export withdrawal requests to CSV
 */
export function exportWithdrawalRequests(requests: any[]): void {
    const headers = [
        'Request ID',
        'Talent Name',
        'Amount (Coins)',
        'Bank Name',
        'Account Number',
        'Account Name',
        'Status',
        'Requested Date',
        'Processed Date',
        'Admin Notes'
    ]

    const csvData = requests.map(r => ({
        'Request ID': r.id.slice(0, 8),
        'Talent Name': r.talent?.display_name || 'Unknown',
        'Amount (Coins)': r.amount,
        'Bank Name': r.bank_name,
        'Account Number': r.account_number,
        'Account Name': r.account_name,
        'Status': r.status,
        'Requested Date': new Date(r.created_at).toLocaleString('en-NG'),
        'Processed Date': r.processed_at ? new Date(r.processed_at).toLocaleString('en-NG') : 'N/A',
        'Admin Notes': r.admin_notes || 'N/A'
    }))

    const csv = convertToCSV(csvData, headers)
    downloadCSV(csv, 'withdrawal_requests')
}

/**
 * Export payout history to CSV
 */
export function exportPayoutHistory(payouts: any[]): void {
    const headers = [
        'Transaction ID',
        'User Name',
        'Amount (Coins)',
        'Status',
        'Date',
        'Description'
    ]

    const csvData = payouts.map(p => ({
        'Transaction ID': p.id.slice(0, 8),
        'User Name': p.user?.display_name || 'Unknown',
        'Amount (Coins)': Math.abs(p.coins || p.amount || 0),
        'Status': p.status,
        'Date': new Date(p.created_at).toLocaleString('en-NG'),
        'Description': p.description || 'N/A'
    }))

    const csv = convertToCSV(csvData, headers)
    downloadCSV(csv, 'payout_history')
}

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsData(
    stats: any,
    userGrowthData: any[],
    bookingTrendsData: any[],
    revenueData: any[]
): void {
    const headers = [
        'Metric',
        'Value',
        'Period'
    ]

    const csvData = [
        { Metric: 'Total Users', Value: stats.totalUsers, Period: 'All Time' },
        { Metric: 'Total Clients', Value: stats.totalClients, Period: 'All Time' },
        { Metric: 'Total Talents', Value: stats.totalTalents, Period: 'All Time' },
        { Metric: 'Total Bookings', Value: stats.totalBookings, Period: 'All Time' },
        { Metric: 'Pending Bookings', Value: stats.pendingBookings, Period: 'All Time' },
        { Metric: 'Completed Bookings', Value: stats.completedBookings, Period: 'All Time' },
        { Metric: 'Total Revenue (NGN)', Value: stats.totalRevenue, Period: 'All Time' },
        { Metric: 'Weekly Users', Value: stats.weeklyUsers, Period: 'This Week' },
        { Metric: 'Weekly Bookings', Value: stats.weeklyBookings, Period: 'This Week' },
        { Metric: 'Weekly Revenue (NGN)', Value: stats.weeklyRevenue, Period: 'This Week' },
    ]

    // Add time series data
    userGrowthData.forEach((d, i) => {
        csvData.push({
            Metric: 'User Growth',
            Value: d.count || 0,
            Period: d.date
        })
    })

    bookingTrendsData.forEach((d, i) => {
        csvData.push({
            Metric: 'Booking Trends',
            Value: d.count || 0,
            Period: d.date
        })
    })

    revenueData.forEach((d, i) => {
        csvData.push({
            Metric: 'Revenue',
            Value: d.amount || 0,
            Period: d.date
        })
    })

    const csv = convertToCSV(csvData, headers)
    downloadCSV(csv, 'analytics')
}
