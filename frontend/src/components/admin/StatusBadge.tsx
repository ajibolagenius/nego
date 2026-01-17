'use client'

import { CheckCircle, XCircle, Clock, Warning } from '@phosphor-icons/react'

interface StatusBadgeProps {
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
    size?: 'sm' | 'md' | 'lg'
    showIcon?: boolean
}

const statusConfig = {
    pending: {
        label: 'Pending',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Clock
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: CheckCircle
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: XCircle
    },
    completed: {
        label: 'Completed',
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: CheckCircle
    },
    failed: {
        label: 'Failed',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: Warning
    },
}

const sizeConfig = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeConfig[size]}`}
            role="status"
            aria-label={`Status: ${config.label}`}
        >
            {showIcon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} weight="fill" />}
            {config.label}
        </span>
    )
}
