'use client'

import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    isLoading?: boolean
    warning?: string
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    isLoading = false,
    warning,
}: ConfirmDialogProps) {
    if (!isOpen) return null

    const confirmColor = variant === 'destructive'
        ? 'bg-red-500 hover:bg-red-600'
        : 'bg-green-500 hover:bg-green-600'

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors p-1"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-white/60 text-sm mb-4">{description}</p>

                {warning && (
                    <p className="text-amber-400 text-xs mb-4 flex items-center gap-1">
                        <span>⚠️</span>
                        {warning}
                    </p>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={isLoading}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 ${confirmColor} text-white`}
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
