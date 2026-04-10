'use client'

import { useState, useTransition } from 'react'
import { User, ShieldCheck, MaskHappy, Ghost, SpinnerGap, ArrowsClockwise } from '@phosphor-icons/react'
import { setRolePreviewAction } from '@/actions/role-preview'
import { PreviewRole } from '@/lib/admin/role-preview'

interface RolePreviewSwitcherProps {
    currentRole: PreviewRole
}

export function RolePreviewSwitcher({ currentRole }: RolePreviewSwitcherProps) {
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(true)

    const handleRoleChange = (role: PreviewRole) => {
        startTransition(async () => {
            await setRolePreviewAction(role === 'admin' ? null : role)
        })
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-[#df2531] text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all border border-white/20"
                title="Open Role Preview"
            >
                <ArrowsClockwise size={24} className={isPending ? 'animate-spin' : ''} />
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#df2531]" weight="fill" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Admin Preview Mode</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-white/20 hover:text-white/60 text-[10px] font-medium transition-colors"
                    >
                        Hide
                    </button>
                </div>
                
                <div className="flex items-stretch gap-1">
                    <RoleButton 
                        active={currentRole === 'admin'} 
                        icon={ShieldCheck} 
                        label="Admin" 
                        onClick={() => handleRoleChange('admin')} 
                        disabled={isPending}
                    />
                    <RoleButton 
                        active={currentRole === 'talent'} 
                        icon={MaskHappy} 
                        label="Talent" 
                        onClick={() => handleRoleChange('talent')} 
                        disabled={isPending}
                        activeColor="bg-[#df2531]"
                    />
                    <RoleButton 
                        active={currentRole === 'client'} 
                        icon={User} 
                        label="Client" 
                        onClick={() => handleRoleChange('client')} 
                        disabled={isPending}
                        activeColor="bg-blue-600"
                    />
                    <RoleButton 
                        active={currentRole === 'guest'} 
                        icon={Ghost} 
                        label="Guest" 
                        onClick={() => handleRoleChange('guest')} 
                        disabled={isPending}
                        activeColor="bg-zinc-600"
                    />
                </div>

                {isPending && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <SpinnerGap size={24} className="animate-spin text-white" />
                    </div>
                )}
            </div>
        </div>
    )
}

interface RoleButtonProps {
    active: boolean
    icon: any
    label: string
    onClick: () => void
    disabled?: boolean
    activeColor?: string
}

function RoleButton({ active, icon: Icon, label, onClick, disabled, activeColor = 'bg-white/10' }: RoleButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 ${
                active 
                    ? `${activeColor} text-white shadow-lg scale-[1.02]` 
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70'
            }`}
        >
            <Icon size={20} weight={active ? 'fill' : 'regular'} />
            <span className={`text-[10px] font-semibold ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
        </button>
    )
}
