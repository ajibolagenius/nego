'use client'

interface AvatarPlaceholderProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AvatarPlaceholder({ className = '', size = 'md' }: AvatarPlaceholderProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    }

    return (
        <div className={`flex items-center justify-center w-full h-full bg-white/5 ${className}`}>
            <span className={`logo-font ${sizeClasses[size]}`}>
                <span className="text-white">NO AVATAR</span>
                <span className="text-[#df2531]">.</span>
            </span>
        </div>
    )
}
