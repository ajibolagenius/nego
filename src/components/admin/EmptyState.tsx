'use client'

import { Icon } from '@phosphor-icons/react'

interface EmptyStateProps {
    icon: Icon
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
    sm: { icon: 32, title: 'text-base', desc: 'text-sm' },
    md: { icon: 40, title: 'text-lg', desc: 'text-sm' },
    lg: { icon: 48, title: 'text-xl', desc: 'text-base' },
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    size = 'md'
}: EmptyStateProps) {
    const sizes = sizeConfig[size]

    return (
        <div className="text-center py-12 sm:py-16 rounded-2xl bg-white/5 border border-white/10">
            <Icon
                size={sizes.icon}
                weight="duotone"
                className="text-white/20 mx-auto mb-4"
                aria-hidden="true"
            />
            <h3 className={`${sizes.title} font-bold text-white mb-2`}>{title}</h3>
            {description && (
                <p className={`${sizes.desc} text-white/50 mb-6 max-w-md mx-auto`}>
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 rounded-xl bg-[#df2531] text-white text-sm font-medium hover:bg-[#c41f2a] transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}
